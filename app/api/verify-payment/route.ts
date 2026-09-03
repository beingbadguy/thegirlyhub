import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { placeOrderRecord } from "@/lib/placeOrderRecord";
import { prepareCheckout } from "@/lib/prepareCheckout";
import Order from "@/models/order.model";
import PendingPayment from "@/models/pendingPayment.model";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

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
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing Razorpay payment verification fields." },
        { status: 400 },
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
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

    const pending = await PendingPayment.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (!pending) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment session not found. Please try checkout again.",
        },
        { status: 404 },
      );
    }

    if (pending.userId && decoded?.userId && pending.userId.toString() !== decoded.userId) {
      return NextResponse.json(
        { success: false, message: "This payment does not belong to your account." },
        { status: 403 },
      );
    }

    const prepared = await prepareCheckout(
      {
        ...pending.orderPayload,
        paymentMethod: "online",
      },
      pending.userId?.toString() || decoded?.userId,
    );

    if (!prepared.ok) {
      return NextResponse.json(
        { success: false, message: prepared.message },
        { status: prepared.status },
      );
    }

    if (prepared.data.expectedAmountInPaise !== pending.amountInPaise) {
      return NextResponse.json(
        { success: false, message: "Paid amount does not match order total." },
        { status: 400 },
      );
    }

    const newOrder = await placeOrderRecord(prepared.data, {
      paymentId: razorpay_payment_id,
      paymentStatus: "paid",
    });

    pending.status = "paid";
    pending.paymentId = razorpay_payment_id;
    pending.updatedAt = new Date();
    await pending.save();

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
