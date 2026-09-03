import { databaseConnection } from "@/config/databseConnection";
import { placeOrderRecord } from "@/lib/placeOrderRecord";
import { prepareCheckout } from "@/lib/prepareCheckout";
import Order from "@/models/order.model";
import PendingPayment from "@/models/pendingPayment.model";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

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

  const existingOrder = await Order.findOne({ paymentId });
  if (existingOrder) {
    return NextResponse.json({ success: true, orderId: existingOrder._id });
  }

  const pending = await PendingPayment.findOne({ razorpayOrderId });
  if (!pending || pending.status === "paid") {
    return NextResponse.json({ success: true });
  }

  const prepared = await prepareCheckout(
    {
      ...pending.orderPayload,
      paymentMethod: "online",
    },
    pending.userId?.toString(),
  );

  if (!prepared.ok) {
    console.error("Webhook could not recreate order:", prepared.message);
    return NextResponse.json({ success: false, message: prepared.message }, { status: 400 });
  }

  const newOrder = await placeOrderRecord(prepared.data, {
    paymentId,
    paymentStatus: "paid",
  });

  pending.status = "paid";
  pending.paymentId = paymentId;
  pending.updatedAt = new Date();
  await pending.save();

  return NextResponse.json({ success: true, orderId: newOrder._id });
}
