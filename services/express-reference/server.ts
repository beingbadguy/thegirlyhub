/**
 * Express.js Reference Server Setup for Razorpay Cancellation & Refund System
 *
 * This file serves as a reference and can be mounted directly into a standalone Express.js backend.
 */
import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";

type ExpressRequest = any;
type ExpressResponse = any;
type ExpressApp = any;

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder",
});

// ==========================================
// 1. MONGOOSE MODELS
// ==========================================

const refundHistorySchema = new mongoose.Schema({
  refundId: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  razorpayPaymentId: { type: String, default: null },
  speed: { type: String, enum: ["normal", "optimum"], default: "optimum" },
  reason: { type: String, default: null },
  failureReason: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
});

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["created", "paid"],
      default: "created",
    },
    refundStatus: {
      type: String,
      enum: ["none", "pending", "completed", "failed"],
      default: "none",
    },
    paymentId: { type: String, default: null, sparse: true, index: true },
    refundId: { type: String, default: null, sparse: true },
    refundAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1, min: 1 },
        price: Number,
        title: String,
      },
    ],
    cancellationReason: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
    refundHistory: { type: [refundHistorySchema], default: [] },
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

const productSchema = new mongoose.Schema(
  {
    name: String,
    price: Number,
    countInStock: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

const webhookLogSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true },
    entityId: { type: String, default: null },
    paymentId: { type: String, default: null },
    refundId: { type: String, default: null },
    status: { type: String, enum: ["processed", "failed"], default: "processed" },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const WebhookLog = mongoose.models.WebhookLog || mongoose.model("WebhookLog", webhookLogSchema);

// ==========================================
// 2. CONTROLLERS FOR EXPRESS.JS
// ==========================================

/**
 * Cancellation Controller
 */
export async function cancelOrderController(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  try {
    const { id } = req.params;
    const { reason = "Customer requested cancellation", refundAmount } = req.body || {};

    const order = await Order.findById(id);
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    // 1. Only allow cancel if order not shipped
    if (order.status === "shipped") {
      res.status(400).json({
        success: false,
        message: "Order cannot be cancelled because it has already been shipped.",
      });
      return;
    }

    if (order.status === "cancelled") {
      res.status(400).json({
        success: false,
        message: "Order is already cancelled.",
      });
      return;
    }

    // 2. Prevent duplicate refunds
    if (order.refundStatus === "completed") {
      res.status(400).json({
        success: false,
        message: "A refund has already been completed for this order.",
      });
      return;
    }

    if (order.refundStatus === "pending") {
      res.status(400).json({
        success: false,
        message: "A refund is currently pending for this order.",
      });
      return;
    }

    // 3. Calculate refund amount (Full refund by default, support partial refund)
    const alreadyRefunded = order.refundAmount || 0;
    const remainingRefundable = Math.max(0, order.totalAmount - alreadyRefunded);

    let amountToRefundRupees = remainingRefundable;
    if (refundAmount !== undefined && refundAmount !== null) {
      const parsed = Number(refundAmount);
      if (isNaN(parsed) || parsed <= 0 || parsed > remainingRefundable) {
        res.status(400).json({
          success: false,
          message: `Invalid refund amount. Must be between 1 and ${remainingRefundable}.`,
        });
        return;
      }
      amountToRefundRupees = parsed;
    }

    let refundResponse: any = null;

    // 4. Trigger Razorpay Refund API if order is paid
    if (order.paymentStatus === "paid" && order.paymentId) {
      const amountInPaise = Math.round(amountToRefundRupees * 100);

      try {
        console.log(`[Cancel API] Calling Razorpay Refund API for payment ${order.paymentId}, amount: ₹${amountToRefundRupees}`);
        refundResponse = await razorpay.payments.refund(order.paymentId, {
          amount: amountInPaise,
          speed: "optimum",
          notes: {
            orderId: order._id.toString(),
            reason,
          },
        });

        console.log(`[Cancel API] Razorpay refund initiated successfully: ${refundResponse.id}`);

        const refundStatus = refundResponse.status === "processed" ? "completed" : "pending";

        order.refundId = refundResponse.id;
        order.refundAmount = alreadyRefunded + amountToRefundRupees;
        order.refundStatus = refundStatus;
        order.refundHistory.push({
          refundId: refundResponse.id,
          amount: amountToRefundRupees,
          status: refundStatus,
          razorpayPaymentId: order.paymentId,
          reason,
          createdAt: new Date(),
          processedAt: refundStatus === "completed" ? new Date() : null,
        });
      } catch (rzpErr: any) {
        const errorDesc = rzpErr?.error?.description || rzpErr.message || "Refund API error";
        console.error(`[Cancel API] Razorpay refund failed:`, errorDesc);

        order.refundStatus = "failed";
        order.refundHistory.push({
          refundId: `failed_${Date.now()}`,
          amount: amountToRefundRupees,
          status: "failed",
          razorpayPaymentId: order.paymentId,
          reason,
          failureReason: errorDesc,
          createdAt: new Date(),
        });
        await order.save();

        res.status(502).json({
          success: false,
          message: `Razorpay refund failed: ${errorDesc}`,
        });
        return;
      }
    }

    // 5. Restock products atomically
    if (Array.isArray(order.products)) {
      for (const item of order.products) {
        if (item.productId && item.quantity > 0) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { countInStock: item.quantity, sold: -item.quantity },
          });
        }
      }
    }

    // 6. Update order status to cancelled
    order.status = "cancelled";
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled and refund processed successfully.",
      order,
      refund: refundResponse,
    });
  } catch (err: any) {
    console.error("[Cancel API] Error:", err);
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
}

/**
 * Webhook Controller
 */
export async function razorpayWebhookController(req: ExpressRequest, res: ExpressResponse): Promise<void> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    res.status(500).json({ success: false, message: "Webhook secret not configured" });
    return;
  }

  const signature = req.headers["x-razorpay-signature"] as string;
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  if (!signature || !rawBody) {
    res.status(400).json({ success: false, message: "Missing signature or body" });
    return;
  }

  // 1. Verify Razorpay webhook signature (Constant-time HMAC comparison)
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    const receivedBuf = Buffer.from(signature, "utf8");

    if (
      expectedBuf.length !== receivedBuf.length ||
      !crypto.timingSafeEqual(expectedBuf, receivedBuf)
    ) {
      console.warn("[Webhook] Invalid HMAC signature");
      res.status(400).json({ success: false, message: "Invalid webhook signature" });
      return;
    }
  } catch (sigErr) {
    console.error("[Webhook] Signature verification error:", sigErr);
    res.status(400).json({ success: false, message: "Signature verification failed" });
    return;
  }

  const event = typeof req.body === "object" && !Buffer.isBuffer(req.body) ? req.body : JSON.parse(rawBody);
  const eventType = event.event;
  const eventId =
    event.event_id ||
    event.id ||
    `${eventType}_${event?.payload?.payment?.entity?.id || event?.payload?.refund?.entity?.id || Date.now()}`;

  console.log(`[Webhook] Processing event: ${eventType} (Event ID: ${eventId})`);

  // 2. Idempotency Check (Avoid duplicate processing on webhook retries)
  try {
    const existingLog = await WebhookLog.findOneAndUpdate(
      { eventId },
      {
        $setOnInsert: {
          eventId,
          eventType,
          entityId: event?.payload?.payment?.entity?.id || event?.payload?.refund?.entity?.id,
          paymentId: event?.payload?.payment?.entity?.id || event?.payload?.refund?.entity?.payment_id,
          refundId: event?.payload?.refund?.entity?.id,
          status: "processed",
          payload: event,
          processedAt: new Date(),
        },
      },
      { upsert: true, new: false }
    );

    if (existingLog) {
      console.log(`[Webhook] Duplicate event ${eventId} already handled.`);
      res.status(200).json({ success: true, message: "Duplicate event ignored (idempotent)" });
      return;
    }
  } catch (idempErr: any) {
    if (idempErr.code === 11000) {
      res.status(200).json({ success: true, message: "Duplicate event race ignored" });
      return;
    }
  }

  // 3. Handle Webhook Events
  try {
    switch (eventType) {
      // payment.captured -> mark order paid, confirm order
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        const paymentId = payment.id;
        const orderIdInNotes = payment.notes?.orderId;

        let order = orderIdInNotes ? await Order.findById(orderIdInNotes) : null;
        if (!order) {
          order = await Order.findOne({ paymentId });
        }

        if (order) {
          order.paymentStatus = "paid";
          order.paymentId = paymentId;
          if (order.status === "pending") {
            order.status = "confirmed";
          }
          await order.save();
          console.log(`[Webhook] Order ${order._id} marked as paid & confirmed.`);
        }
        break;
      }

      // refund.created -> mark refund pending
      case "refund.created": {
        const refund = event.payload.refund.entity;
        const refundId = refund.id;
        const paymentId = refund.payment_id;
        const orderIdInNotes = refund.notes?.orderId;

        let order = orderIdInNotes ? await Order.findById(orderIdInNotes) : null;
        if (!order) {
          order = await Order.findOne({ paymentId });
        }

        if (order) {
          order.refundStatus = "pending";
          order.refundId = refundId;
          const exists = order.refundHistory.some((h: any) => h.refundId === refundId);
          if (!exists) {
            order.refundHistory.push({
              refundId,
              amount: (refund.amount || 0) / 100,
              status: "pending",
              razorpayPaymentId: paymentId,
              createdAt: new Date(),
            });
          }
          await order.save();
          console.log(`[Webhook] Order ${order._id} refund status set to pending.`);
        }
        break;
      }

      // refund.processed -> mark refund completed
      case "refund.processed": {
        const refund = event.payload.refund.entity;
        const refundId = refund.id;
        const paymentId = refund.payment_id;
        const orderIdInNotes = refund.notes?.orderId;

        let order = orderIdInNotes ? await Order.findById(orderIdInNotes) : null;
        if (!order) {
          order = await Order.findOne({ paymentId });
        }

        if (order) {
          order.refundStatus = "completed";
          order.refundId = refundId;
          const historyItem = order.refundHistory.find((h: any) => h.refundId === refundId);
          if (historyItem) {
            historyItem.status = "completed";
            historyItem.processedAt = new Date();
          }
          await order.save();
          console.log(`[Webhook] Order ${order._id} refund status set to completed.`);
        }
        break;
      }

      // refund.failed -> mark refund failed
      case "refund.failed": {
        const refund = event.payload.refund.entity;
        const refundId = refund.id;
        const paymentId = refund.payment_id;
        const failureReason = refund.error_description || "Refund processing failed";
        const orderIdInNotes = refund.notes?.orderId;

        let order = orderIdInNotes ? await Order.findById(orderIdInNotes) : null;
        if (!order) {
          order = await Order.findOne({ paymentId });
        }

        if (order) {
          order.refundStatus = "failed";
          const historyItem = order.refundHistory.find((h: any) => h.refundId === refundId);
          if (historyItem) {
            historyItem.status = "failed";
            historyItem.failureReason = failureReason;
          }
          await order.save();
          console.error(`[Webhook] Order ${order._id} refund status set to failed: ${failureReason}`);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

    res.status(200).json({ success: true, message: `Event ${eventType} processed` });
  } catch (eventErr: any) {
    console.error(`[Webhook] Error handling event ${eventType}:`, eventErr);
    res.status(500).json({ success: false, message: eventErr.message });
  }
}

/**
 * Helper to mount routes onto an existing Express app instance
 */
export function registerRazorpayRoutes(app: ExpressApp) {
  app.post("/api/orders/:id/cancel", cancelOrderController);
  app.post("/api/razorpay/webhook", razorpayWebhookController);
}
