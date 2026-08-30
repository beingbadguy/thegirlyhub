import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { FIRST_ORDER_DISCOUNT_RATE } from "@/lib/orderValidation";
import { calculateShipping } from "@/lib/shipping";
import Cart from "@/models/cart.model";
import Coupon from "@/models/coupon.model";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import {
  OrderConfirmationMail,
  orderPlacedMessageToAdmin,
} from "@/services/sendMail";
import crypto from "crypto";
import { after, NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

function signaturesMatch(generatedSignature: string, razorpaySignature: string) {
  const generated = Buffer.from(generatedSignature);
  const received = Buffer.from(razorpaySignature);

  return (
    generated.length === received.length &&
    crypto.timingSafeEqual(generated, received)
  );
}

export async function POST(req: NextRequest) {
  await databaseConnection();

  try {
    const decoded = await fetchTokenDetails(req);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "You must log in to verify a payment." },
        { status: 401 },
      );
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderData,
    } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing Razorpay payment verification fields." },
        { status: 400 },
      );
    }

    if (!orderData) {
      return NextResponse.json(
        { success: false, message: "Missing order details." },
        { status: 400 },
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { success: false, message: "Razorpay is not configured." },
        { status: 500 },
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!signaturesMatch(generatedSignature, razorpay_signature)) {
      return NextResponse.json(
        { success: false, message: "Payment verification failed: invalid signature." },
        { status: 400 },
      );
    }

    const existingOrder = await Order.findOne({ paymentId: razorpay_payment_id });
    if (existingOrder) {
      return NextResponse.json(
        { success: true, orderId: existingOrder._id },
        { status: 200 },
      );
    }

    const {
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
    const userId = decoded.userId.toString();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    if (!Array.isArray(payloadProducts) || payloadProducts.length === 0) {
      return NextResponse.json(
        { success: false, message: "Your cart is empty." },
        { status: 400 },
      );
    }

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
          {
            success: false,
            message: `"${item.title || "A product"}" is no longer available.`,
          },
          { status: 400 },
        );
      }

      if (dbProduct.countInStock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Only ${dbProduct.countInStock} unit(s) left for "${dbProduct.title}".`,
          },
          { status: 400 },
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

    const shipping = calculateShipping(subtotal, "online");
    const shippingCharge = shipping.shippingCharge;
    const firstTimeDiscount = user.firstPurchase
      ? 0
      : (subtotal + shippingCharge) * FIRST_ORDER_DISCOUNT_RATE;
    let expectedTotal = Math.max(
      0,
      Math.round((subtotal + shippingCharge - firstTimeDiscount) * 100) / 100,
    );
    let appliedCouponDiscount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: String(couponCode).toUpperCase(),
      });

      if (coupon && coupon.isActive) {
        appliedCouponDiscount =
          coupon.type === "percentage"
            ? Math.round(((expectedTotal * coupon.discount) / 100) * 100) / 100
            : coupon.discount;
        expectedTotal = Math.max(
          0,
          Math.round((expectedTotal - appliedCouponDiscount) * 100) / 100,
        );

        await Coupon.findOneAndUpdate(
          { code: String(couponCode).toUpperCase() },
          { $addToSet: { usersAvailed: userId } },
        );
      }
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    const expectedAmountInPaise = Math.round(expectedTotal * 100);

    if (Number(razorpayOrder.amount) !== expectedAmountInPaise) {
      return NextResponse.json(
        { success: false, message: "Paid amount does not match order total." },
        { status: 400 },
      );
    }

    const newOrder = new Order({
      userId,
      totalAmount: expectedTotal,
      subtotal,
      shippingCharge,
      firstOrderDiscount: Math.round(firstTimeDiscount * 100) / 100,
      couponDiscount: appliedCouponDiscount,
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

    await Promise.all([
      ...verifiedProducts.map((item) =>
        Product.findByIdAndUpdate(item.productId, {
          $inc: { sold: item.quantity, countInStock: -item.quantity },
        }),
      ),
      Cart.findOneAndDelete({ userId }),
    ]);

    user.order.push(newOrder._id);
    user.firstPurchase = true;
    user.cart = [];
    user.address = String(address).trim();
    user.city = String(city).trim();
    user.state = String(state).trim();
    user.landmark = landmark?.trim() || null;
    user.zip = Number(zip);
    user.phone = Number(phone);
    user.updatedAt = new Date();
    await user.save();

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

    return NextResponse.json(
      { success: true, orderId: newOrder._id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during payment verification." },
      { status: 500 },
    );
  }
}
