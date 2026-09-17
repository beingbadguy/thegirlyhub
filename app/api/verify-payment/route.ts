import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { placeOrderRecord } from "@/lib/placeOrderRecord";
import { prepareCheckout, type PreparedCheckout } from "@/lib/prepareCheckout";
import Order from "@/models/order.model";
import PendingPayment from "@/models/pendingPayment.model";
import Razorpay from "razorpay";
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

async function triggerAutoRefund(
  razorpay: Razorpay,
  paymentId: string,
  amountInPaise: number,
  reason: string,
) {
  try {
    console.warn(`[AutoRefund] Triggering automated refund for payment ${paymentId}. Reason: ${reason}`);
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amountInPaise,
      notes: { reason, autoRefund: "true" },
    });
    console.log(`[AutoRefund] Refund created successfully for ${paymentId}:`, refund.id);
    return refund;
  } catch (err) {
    console.error(`[AutoRefund] Failed to refund payment ${paymentId}:`, err);
    return null;
  }
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

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret || !keyId) {
      return NextResponse.json(
        { success: false, message: "Razorpay is not configured." },
        { status: 500 },
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!signaturesMatch(generatedSignature, razorpay_signature)) {
      console.warn(`[POST /api/verify-payment] Security alert: Invalid signature for payment ${razorpay_payment_id}`);
      return NextResponse.json(
        { success: false, message: "Payment verification failed: invalid signature." },
        { status: 400 },
      );
    }

    // 1. Idempotency Check: Check if an Order already exists for this paymentId
    const existingOrder = await Order.findOne({ paymentId: razorpay_payment_id });
    if (existingOrder) {
      console.log(`[POST /api/verify-payment] Existing order returned for payment ${razorpay_payment_id}`);
      return NextResponse.json(
        {
          success: true,
          orderId: existingOrder._id.toString(),
          paymentId: razorpay_payment_id,
        },
        { status: 200 },
      );
    }

    // 2. Atomic Claim: Transition status from "pending" to "processing"
    const pending = await PendingPayment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, status: "pending" },
      { status: "processing", paymentId: razorpay_payment_id, updatedAt: new Date() },
      { new: true },
    );

    if (!pending) {
      // Check if it was already processed concurrently
      const completedOrder = await Order.findOne({ paymentId: razorpay_payment_id });
      if (completedOrder) {
        return NextResponse.json(
          {
            success: true,
            orderId: completedOrder._id.toString(),
            paymentId: razorpay_payment_id,
          },
          { status: 200 },
        );
      }

      const existingPending = await PendingPayment.findOne({ razorpayOrderId: razorpay_order_id });
      if (existingPending?.status === "paid" && existingPending.paymentId) {
        const order = await Order.findOne({ paymentId: existingPending.paymentId });
        if (order) {
          return NextResponse.json(
            {
              success: true,
              orderId: order._id.toString(),
              paymentId: existingPending.paymentId,
            },
            { status: 200 },
          );
        }
      }

      console.warn(`[POST /api/verify-payment] Payment session ${razorpay_order_id} already being processed or not found.`);
      return NextResponse.json(
        {
          success: false,
          message: "Payment session already processed or not found.",
        },
        { status: 409 },
      );
    }

    // 3. User Ownership Verification
    if (pending.userId && decoded?.userId && pending.userId.toString() !== decoded.userId) {
      console.warn(`[POST /api/verify-payment] Security alert: Payment does not belong to user account.`);
      return NextResponse.json(
        { success: false, message: "This payment does not belong to your account." },
        { status: 403 },
      );
    }

    // 4. Use Locked Checkout Snapshot (Fixes State Desynchronization)
    let checkoutData: PreparedCheckout | null = (pending.snapshot as PreparedCheckout) || null;

    if (!checkoutData) {
      const prepared = await prepareCheckout(
        {
          ...pending.orderPayload,
          paymentMethod: "online",
        },
        pending.userId?.toString() || decoded?.userId,
      );

      if (prepared.ok) {
        checkoutData = prepared.data;
      }
    }

    if (!checkoutData) {
      console.error(`[POST /api/verify-payment] Checkout data unavailable for payment ${razorpay_payment_id}. Initiating auto-refund.`);
      await triggerAutoRefund(razorpay, razorpay_payment_id, pending.amountInPaise, "Order snapshot missing/invalid");
      pending.status = "refunded";
      pending.updatedAt = new Date();
      await pending.save();

      return NextResponse.json(
        {
          success: false,
          message: "Order creation could not be completed. Your payment has been automatically refunded.",
        },
        { status: 400 },
      );
    }

    // 5. Atomic Order Creation
    try {
      const newOrder = await placeOrderRecord(checkoutData, {
        paymentId: razorpay_payment_id,
        paymentStatus: "paid",
      });

      pending.status = "paid";
      pending.paymentId = razorpay_payment_id;
      pending.updatedAt = new Date();
      await pending.save();

      // Record in Payment collection and Transactions ledger
      try {
        const { recordPaymentSuccess } = await import("@/services/ledger.service");
        await recordPaymentSuccess({
          orderId: newOrder._id,
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          amount: newOrder.totalAmount,
          userId: newOrder.userId || pending.userId,
          email: newOrder.email,
          contact: String(newOrder.phone || ""),
          method: "online",
        });
      } catch (ledgerErr) {
        console.error("[verify-payment] Non-blocking ledger recording error:", ledgerErr);
      }

      console.log(`[POST /api/verify-payment] Order placed successfully: ${newOrder._id} for payment ${razorpay_payment_id}`);

      return NextResponse.json(
        {
          success: true,
          orderId: newOrder._id.toString(),
          paymentId: razorpay_payment_id,
        },
        { status: 200 },
      );
    } catch (orderErr: any) {
      console.error(`[POST /api/verify-payment] Error creating order record:`, orderErr);

      // Duplicate key error (E11000) on paymentId: order already saved by concurrent process
      if (orderErr?.code === 11000) {
        const existing = await Order.findOne({ paymentId: razorpay_payment_id });
        if (existing) {
          return NextResponse.json(
            {
              success: true,
              orderId: existing._id.toString(),
              paymentId: razorpay_payment_id,
            },
            { status: 200 },
          );
        }
      }

      // Unexpected failure after payment captured -> auto refund
      await triggerAutoRefund(razorpay, razorpay_payment_id, pending.amountInPaise, "Server error during order record placement");
      pending.status = "failed";
      pending.updatedAt = new Date();
      await pending.save();

      return NextResponse.json(
        {
          success: false,
          message: "Unable to complete order registration. If your account was debited, an automatic refund has been processed.",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during payment verification." },
      { status: 500 },
    );
  }
}

