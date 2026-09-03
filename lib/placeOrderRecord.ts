import Cart from "@/models/cart.model";
import Coupon from "@/models/coupon.model";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
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

  await newOrder.save();

  const stockUpdates = prepared.verifiedProducts.map((item) =>
    Product.findByIdAndUpdate(item.productId, {
      $inc: { sold: item.quantity, countInStock: -item.quantity },
    }),
  );

  const extrasUpdates: Promise<unknown>[] = [];
  if (prepared.couponCode) {
    extrasUpdates.push(
      Coupon.findOneAndUpdate(
        { code: prepared.couponCode },
        { $addToSet: { usersAvailed: prepared.couponClaimKey } },
      ),
    );
  }

  if (prepared.user) {
    prepared.user.order.push(newOrder._id);
    prepared.user.firstPurchase = true;
    prepared.user.cart = [];
    prepared.user.address = prepared.address;
    prepared.user.city = prepared.city;
    prepared.user.state = prepared.state;
    prepared.user.landmark = prepared.landmark;
    prepared.user.zip = prepared.zip;
    prepared.user.phone = prepared.phone;
    prepared.user.updatedAt = new Date();
    extrasUpdates.push(prepared.user.save());
    extrasUpdates.push(Cart.findOneAndDelete({ userId: prepared.userId }));
  }

  await Promise.all([...stockUpdates, ...extrasUpdates]);

  const orderId = newOrder._id.toString();
  const mailPayload = {
    _id: orderId,
    totalAmount: newOrder.totalAmount,
    address: `${newOrder.address}, ${newOrder.city}, ${newOrder.state} - ${newOrder.zip}`,
    paymentMethod: newOrder.paymentMethod,
    deliveryType: newOrder.deliveryType,
    products: prepared.verifiedProducts,
  };
  const customerEmail = prepared.email;
  const customerName = prepared.user?.name || prepared.recipientName;

  after(async () => {
    try {
      await Promise.all([
        OrderConfirmationMail(customerEmail, customerName, mailPayload),
        orderPlacedMessageToAdmin(customerEmail, customerName),
      ]);
    } catch (mailError) {
      console.error("Order confirmation email failed:", mailError);
    }
  });

  return newOrder;
}
