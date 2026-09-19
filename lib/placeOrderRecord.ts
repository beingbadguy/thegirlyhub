import Cart from "@/models/cart.model";
import Coupon from "@/models/coupon.model";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import {
  OrderConfirmationMail,
  orderPlacedMessageToAdmin,
} from "@/services/sendMail";
import { after } from "next/server";
import type { PreparedCheckout } from "@/lib/prepareCheckout";

export async function placeOrderRecord(
  prepared: PreparedCheckout,
  extras: {
    paymentId?: string | null;
    paymentStatus?: "paid" | "unpaid";
  } = {},
) {
  if (extras.paymentId) {
    const existing = await Order.findOne({ paymentId: extras.paymentId });
    if (existing) return existing;
  }

  // 1. Atomic Stock Claim: Deduct stock with condition { countInStock: { $gte: qty } }
  // Sort product IDs deterministically to prevent cross-transaction lock-ordering deadlocks
  const consolidatedStockNeeds = new Map<string, number>();
  for (const item of prepared.verifiedProducts) {
    const idStr = String(item.productId);
    consolidatedStockNeeds.set(
      idStr,
      (consolidatedStockNeeds.get(idStr) || 0) + item.quantity,
    );
  }

  const sortedProductIds = Array.from(consolidatedStockNeeds.keys()).sort();
  const deductedStock: { productId: string; quantity: number }[] = [];

  for (const productId of sortedProductIds) {
    const qty = consolidatedStockNeeds.get(productId)!;
    const updated = await Product.findOneAndUpdate(
      {
        _id: productId,
        countInStock: { $gte: qty },
      },
      {
        $inc: { sold: qty, countInStock: -qty },
      },
      { new: true, select: "_id countInStock" },
    ).lean();

    if (!updated) {
      // Roll back already deducted products in this order batch
      if (deductedStock.length > 0) {
        await Promise.all(
          deductedStock.map((d) =>
            Product.findByIdAndUpdate(d.productId, {
              $inc: { sold: -d.quantity, countInStock: d.quantity },
            }),
          ),
        );
      }
      const itemInfo = prepared.verifiedProducts.find(
        (p) => String(p.productId) === productId,
      );
      const title = itemInfo?.title || "Item";
      const outOfStockErr: any = new Error(`"${title}" is out of stock.`);
      outOfStockErr.code = "OUT_OF_STOCK";
      outOfStockErr.statusCode = 400;
      throw outOfStockErr;
    }

    deductedStock.push({ productId, quantity: qty });
  }

  const newOrder = new Order({
    userId: prepared.userId || undefined,
    isGuest: prepared.isGuest,
    totalAmount: prepared.expectedTotal,
    subtotal: prepared.subtotal,
    shippingCharge: prepared.shippingCharge,
    firstOrderDiscount: prepared.firstTimeDiscount,
    couponDiscount: prepared.appliedCouponDiscount,
    paymentMethod: prepared.paymentMethod,
    deliveryType: prepared.deliveryType,
    recipientName: prepared.recipientName,
    email: prepared.email,
    address: prepared.address,
    city: prepared.city,
    state: prepared.state,
    landmark: prepared.landmark,
    orderNotes: prepared.orderNotes,
    phone: prepared.phone,
    products: prepared.verifiedProducts,
    zip: prepared.zip,
    couponCode: prepared.couponCode,
    paymentId: extras.paymentId || null,
    paymentStatus:
      extras.paymentStatus ||
      (prepared.paymentMethod === "online" ? "paid" : "unpaid"),
    status: "processing",
  });

  try {
    await newOrder.save();
  } catch (saveErr: any) {
    // Roll back stock deductions on failure
    await Promise.all(
      deductedStock.map((d) =>
        Product.findByIdAndUpdate(d.productId, {
          $inc: { sold: -d.quantity, countInStock: d.quantity },
        }),
      ),
    );

    if (saveErr?.code === 11000 && extras.paymentId) {
      const existing = await Order.findOne({ paymentId: extras.paymentId });
      if (existing) return existing;
    }
    throw saveErr;
  }

  const extrasUpdates: Promise<unknown>[] = [];
  if (prepared.couponCode) {
    extrasUpdates.push(
      Coupon.findOneAndUpdate(
        { code: prepared.couponCode },
        { $addToSet: { usersAvailed: prepared.couponClaimKey } },
      ),
    );
  }

  const userIdToFind = prepared.userId || (prepared.user as any)?._id;
  const userToUpdate = userIdToFind
    ? await User.findById(userIdToFind)
    : await User.findOne({ email: prepared.email });

  if (userToUpdate) {
    const orderIdStr = newOrder._id.toString();
    if (!Array.isArray(userToUpdate.order)) {
      userToUpdate.order = [];
    }
    const alreadyHasOrder = userToUpdate.order.some(
      (oid: any) => oid?.toString() === orderIdStr,
    );
    if (!alreadyHasOrder) {
      userToUpdate.order.push(newOrder._id);
    }
    userToUpdate.firstPurchase = true;
    userToUpdate.cart = [];
    userToUpdate.address = prepared.address;
    userToUpdate.city = prepared.city;
    userToUpdate.state = prepared.state;
    userToUpdate.landmark = prepared.landmark || null;
    userToUpdate.zip = Number(prepared.zip);
    userToUpdate.phone = Number(prepared.phone);
    if (
      prepared.recipientName &&
      (!userToUpdate.name || userToUpdate.name.trim() === "User")
    ) {
      userToUpdate.name = prepared.recipientName;
    }
    userToUpdate.updatedAt = new Date();
    extrasUpdates.push(userToUpdate.save());
    extrasUpdates.push(Cart.findOneAndDelete({ userId: userToUpdate._id }));
  }

  await Promise.all(extrasUpdates);

  const orderId = newOrder._id.toString();
  const customerEmail = prepared.email;
  const customerName = prepared.user?.name || prepared.recipientName;

  const mailPayload = {
    _id: orderId,
    totalAmount: newOrder.totalAmount,
    subtotal: newOrder.subtotal,
    shippingCharge: newOrder.shippingCharge,
    firstOrderDiscount: newOrder.firstOrderDiscount,
    couponDiscount: newOrder.couponDiscount,
    couponCode: newOrder.couponCode,
    recipientName: newOrder.recipientName || customerName,
    phone: newOrder.phone,
    address: `${newOrder.address}${newOrder.landmark ? `, ${newOrder.landmark}` : ""}, ${newOrder.city}, ${newOrder.state} - ${newOrder.zip}`,
    paymentMethod: newOrder.paymentMethod,
    paymentStatus: newOrder.paymentStatus,
    deliveryType: newOrder.deliveryType,
    products: prepared.verifiedProducts,
  };

  after(async () => {
    try {
      await Promise.all([
        OrderConfirmationMail(customerEmail, customerName, mailPayload),
        orderPlacedMessageToAdmin(customerEmail, customerName, mailPayload),
      ]);
    } catch (mailError) {
      console.error("Order confirmation email failed:", mailError);
    }
  });

  return newOrder;
}
