import { databaseConnection } from "@/config/databseConnection";
import { placeOrderRecord } from "@/lib/placeOrderRecord";
import { prepareCheckout, type PreparedCheckout } from "@/lib/prepareCheckout";
import Order from "@/models/order.model";
import PendingPayment from "@/models/pendingPayment.model";
import Razorpay from "razorpay";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

async function triggerAutoRefund(
  razorpay: Razorpay,
  paymentId: string,
  amountInPaise: number,
  reason: string,
) {
  try {
    console.warn(`[Webhook AutoRefund] Triggering automated refund for payment ${paymentId}. Reason: ${reason}`);
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amountInPaise,
      notes: { reason, autoRefund: "true" },
    });
    console.log(`[Webhook AutoRefund] Refund created successfully for ${paymentId}:`, refund.id);
    return refund;
  } catch (err) {
    console.error(`[Webhook AutoRefund] Failed to refund payment ${paymentId}:`, err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  await databaseConnection();

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { success: false, message: "Webhook secret is not configured." },
      { status: 500 },
    );
  }

  const signature = req.headers.get("x-razorpay-signature");
  const rawBody = await req.text();

  if (!signature) {
    return NextResponse.json(
      { success: false, message: "Missing webhook signature." },
      { status: 400 },
    );
  }

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signature);
  if (
    expectedBuf.length !== receivedBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, receivedBuf)
  ) {
    console.warn("[POST /api/razorpay/webhook] Invalid webhook signature detected.");
    return NextResponse.json(
      { success: false, message: "Invalid webhook signature." },
      { status: 400 },
    );
  }

  const event = JSON.parse(rawBody);
  const paymentEntity = event?.payload?.payment?.entity;
  const razorpayOrderId = paymentEntity?.order_id;
  const paymentId = paymentEntity?.id;

  if (event.event === "payment.failed" && razorpayOrderId) {
    await PendingPayment.findOneAndUpdate(
      { razorpayOrderId },
      { status: "failed", paymentId: paymentId || null, updatedAt: new Date() },
    );
    return NextResponse.json({ success: true });
  }

  if (event.event !== "payment.captured" && event.event !== "order.paid") {
    return NextResponse.json({ success: true });
  }

  if (!razorpayOrderId || !paymentId) {
    return NextResponse.json({ success: true });
  }

  // 1. Idempotency Check: Existing Order
  const existingOrder = await Order.findOne({ paymentId });
  if (existingOrder) {
    console.log(`[POST /api/razorpay/webhook] Existing order ${existingOrder._id} found for payment ${paymentId}`);
    return NextResponse.json({ success: true, orderId: existingOrder._id.toString() });
  }

  // 2. Atomic Claim: Transition status from "pending" to "processing"
  const pending = await PendingPayment.findOneAndUpdate(
    { razorpayOrderId, status: "pending" },
    { status: "processing", paymentId, updatedAt: new Date() },
    { new: true },
  );

  if (!pending) {
    const existing = await Order.findOne({ paymentId });
    if (existing) {
      return NextResponse.json({ success: true, orderId: existing._id.toString() });
    }
    // Already processed or in processing by verify-payment
    console.log(`[POST /api/razorpay/webhook] Payment ${paymentId} already handled or being processed.`);
    return NextResponse.json({ success: true });
  }

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const razorpay = keyId && keySecret ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null;

  // 3. Use Locked Checkout Snapshot
  let checkoutData: PreparedCheckout | null = (pending.snapshot as PreparedCheckout) || null;

  if (!checkoutData) {
    const prepared = await prepareCheckout(
      {
        ...pending.orderPayload,
        paymentMethod: "online",
      },
      pending.userId?.toString(),
    );

    if (prepared.ok) {
      checkoutData = prepared.data;
    }
  }

  if (!checkoutData) {
    console.error(`[POST /api/razorpay/webhook] Could not determine checkout data for order ${razorpayOrderId}`);
    if (razorpay) {
      await triggerAutoRefund(razorpay, paymentId, pending.amountInPaise, "Webhook checkout snapshot missing/invalid");
    }
    pending.status = "refunded";
    pending.updatedAt = new Date();
    await pending.save();
    return NextResponse.json({ success: false, message: "Invalid checkout snapshot" }, { status: 400 });
  }

  // 4. Atomic Order Creation
  try {
    const newOrder = await placeOrderRecord(checkoutData, {
      paymentId,
      paymentStatus: "paid",
    });

    pending.status = "paid";
    pending.paymentId = paymentId;
    pending.updatedAt = new Date();
    await pending.save();

    console.log(`[POST /api/razorpay/webhook] Order placed successfully via webhook: ${newOrder._id} for payment ${paymentId}`);
    return NextResponse.json({ success: true, orderId: newOrder._id.toString() });
  } catch (orderErr: any) {
    console.error(`[POST /api/razorpay/webhook] Error placing order record:`, orderErr);

    if (orderErr?.code === 11000) {
      const existing = await Order.findOne({ paymentId });
      if (existing) {
        return NextResponse.json({ success: true, orderId: existing._id.toString() });
      }
    }

    if (razorpay) {
      await triggerAutoRefund(razorpay, paymentId, pending.amountInPaise, "Webhook server error during order creation");
    }
    pending.status = "failed";
    pending.updatedAt = new Date();
    await pending.save();

    return NextResponse.json({ success: false, message: "Order creation error" }, { status: 500 });
  }
}

