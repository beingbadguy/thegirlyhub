import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Cart from "@/models/cart.model";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import Product from "@/models/product.model";
import Coupon from "@/models/coupon.model";
import { databaseConnection } from "@/config/databseConnection";
import { OrderConfirmationMail, orderPlacedMessageToAdmin } from "@/services/sendMail";
import { DELIVERY_CHARGE, FIRST_ORDER_DISCOUNT_RATE } from "@/lib/orderValidation";
import { after } from "next/server";

export async function POST(req: NextRequest) {
  await databaseConnection();
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderData,
    } = await req.json();

    // ── 1. Verify Razorpay signature (HMAC SHA256) ──────────────────────────────
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return NextResponse.json(
        { success: false, message: "Payment verification failed: Invalid signature" },
        { status: 400 }
      );
    }

    // ── 2. Idempotency check ─────────────────────────────────────────────────────
    const existingOrder = await Order.findOne({ paymentId: razorpay_payment_id });
    if (existingOrder) {
      return NextResponse.json({ success: true, orderId: existingOrder._id }, { status: 200 });
    }

    // ── 3. Extract order data ────────────────────────────────────────────────────
    const {
      userId,
      totalAmount,
      paymentMethod,
      deliveryType,
      recipientName,
      email,
      address,
      city,
      state,
      landmark,
      orderNotes,
      phone,
      zip,
      couponCode,
      products: payloadProducts,
    } = orderData;

    // ── 4. Verify user exists ────────────────────────────────────────────────────
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // ── 5. Verify products against DB (server-side price re-verification) ────────
    const dbProducts = await Product.find({
      _id: { $in: payloadProducts.map((p: any) => p.productId) },
    });
    const productsById = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    let subtotal = 0;
    const verifiedProducts = [];

    for (const item of payloadProducts) {
      const dbProduct = productsById.get(String(item.productId));
      if (!dbProduct || !dbProduct.isActive) {
        return NextResponse.json(
          { success: false, message: `"${item.title || "A product"}" is no longer available.` },
          { status: 400 }
        );
      }
      if (dbProduct.countInStock < item.quantity) {
        return NextResponse.json(
          { success: false, message: `Only ${dbProduct.countInStock} unit(s) left for "${dbProduct.title}".` },
          { status: 400 }
        );
      }
      subtotal += dbProduct.discountedPrice * item.quantity;
      verifiedProducts.push({
        productId: dbProduct._id,
        quantity: item.quantity,
        title: dbProduct.title,
        price: dbProduct.discountedPrice,
        image: dbProduct.image,
        size: item.size || "",
      });
    }

    // ── 6. Re-compute expected total (mirrors checkout logic) ────────────────────
    const tax = DELIVERY_CHARGE;
    const firstTimeDiscount = user.firstPurchase
      ? 0
      : (subtotal + tax) * FIRST_ORDER_DISCOUNT_RATE;
    let expectedTotal = Math.max(
      0,
      Math.round((subtotal + tax - firstTimeDiscount) * 100) / 100
    );

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase() });
      if (coupon && coupon.isActive) {
        let discountAmount = 0;
        if (coupon.type === "percentage") {
          discountAmount = Math.round(((expectedTotal * coupon.discount) / 100) * 100) / 100;
        } else {
          discountAmount = coupon.discount;
        }
        expectedTotal = Math.max(0, Math.round((expectedTotal - discountAmount) * 100) / 100);

        // Mark coupon as used
        await Coupon.findOneAndUpdate(
          { code: String(couponCode).toUpperCase() },
          { $addToSet: { usersAvailed: userId } }
        );
      }
    }

    // ── 7. Save order ────────────────────────────────────────────────────────────
    const newOrder = new Order({
      userId,
      totalAmount: expectedTotal,
      paymentMethod: paymentMethod || "online",
      deliveryType: deliveryType || "normal",
      recipientName: String(recipientName).trim(),
      email: email?.trim() || user.email,
      address: String(address).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      landmark: landmark?.trim() || null,
      orderNotes: orderNotes?.trim() || null,
      phone: Number(phone),
      zip: Number(zip),
      products: verifiedProducts,
      couponCode: couponCode || null,
      paymentId: razorpay_payment_id,
      status: "processing",
    });

    await newOrder.save();

    // ── 8. Decrement stock, clear cart, update user ──────────────────────────────
    await Promise.all([
      ...verifiedProducts.map((item) =>
        Product.findByIdAndUpdate(item.productId, {
          $inc: { sold: item.quantity, countInStock: -item.quantity },
        })
      ),
      Cart.findOneAndDelete({ userId }),
    ]);

    user.order.push(newOrder._id);
    user.firstPurchase = true;
    user.cart = [];
    user.address = String(address).trim();
    user.city = String(city).trim();
    user.state = String(state).trim();
    user.zip = Number(zip);
    user.phone = Number(phone);
    user.updatedAt = new Date();
    await user.save();

    // ── 9. Send emails in background ─────────────────────────────────────────────
    const mailPayload = {
      _id: newOrder._id.toString(),
      totalAmount: newOrder.totalAmount,
      address: `${newOrder.address}, ${newOrder.city}, ${newOrder.state} - ${newOrder.zip}`,
      paymentMethod: newOrder.paymentMethod,
      deliveryType: newOrder.deliveryType,
      products: verifiedProducts,
    };
    const customerEmail = user.email;
    const customerName = user.name || recipientName;

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

    return NextResponse.json({ success: true, orderId: newOrder._id }, { status: 200 });

  } catch (error: any) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during payment verification" },
      { status: 500 }
    );
  }
}
