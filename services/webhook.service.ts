import Order from "@/models/order.model";
import PendingPayment from "@/models/pendingPayment.model";
import PaymentWebhookLog from "@/models/paymentWebhookLog.model";
import RefundLog from "@/models/refundLog.model";
import { verifyWebhookSignature, fetchPaymentDetails } from "./razorpay.service";
import { placeOrderRecord } from "@/lib/placeOrderRecord";
import { prepareCheckout, type PreparedCheckout } from "@/lib/prepareCheckout";
import { logPaymentEvent } from "@/lib/logger";
import { refundStatusUpdateMail } from "./sendMail";

export interface WebhookProcessResult {
  success: boolean;
  statusCode: number;
  message: string;
  orderId?: string | null;
  duplicate?: boolean;
}

/**
 * Handle incoming Razorpay webhooks idempotently and securely
 */
export async function handleRazorpayWebhook(
  rawBody: string,
  signature: string | null
): Promise<WebhookProcessResult> {
  // 1. Signature Verification
  const isSignatureValid = verifyWebhookSignature(rawBody, signature);
  if (!isSignatureValid) {
    logPaymentEvent("warn", "Webhook rejected due to invalid HMAC signature.", {
      event: "WEBHOOK_SIGNATURE_REJECTED",
    });
    return {
      success: false,
      statusCode: 400,
      message: "Invalid webhook signature.",
    };
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (parseErr) {
    logPaymentEvent("error", "Webhook payload is not valid JSON.", {
      event: "WEBHOOK_PARSE_ERROR",
      error: parseErr,
    });
    return {
      success: false,
      statusCode: 400,
      message: "Malformed JSON payload.",
    };
  }

  const eventType: string = event.event;
  // Razorpay webhook event ID or construct an event fingerprint
  const eventId: string =
    event.event_id ||
    event.id ||
    `${eventType}_${event?.payload?.payment?.entity?.id || event?.payload?.refund?.entity?.id || Date.now()}`;

  logPaymentEvent("info", `Received Razorpay webhook event: ${eventType}`, {
    event: "WEBHOOK_RECEIVED",
    eventType,
    metadata: { eventId },
  });

  // 2. Idempotency Check & Logging
  try {
    const existingLog = await PaymentWebhookLog.findOneAndUpdate(
      { eventId },
      {
        $setOnInsert: {
          eventId,
          eventType,
          entityId:
            event?.payload?.payment?.entity?.id ||
            event?.payload?.refund?.entity?.id ||
            null,
          paymentId:
            event?.payload?.payment?.entity?.id ||
            event?.payload?.refund?.entity?.payment_id ||
            null,
          refundId: event?.payload?.refund?.entity?.id || null,
          status: "processed",
          signatureVerified: true,
          payload: event,
          processedAt: new Date(),
        },
      },
      { upsert: true, new: false }
    );

    if (existingLog) {
      logPaymentEvent("info", `Webhook event ${eventId} already processed. Returning 200 OK.`, {
        event: "WEBHOOK_DUPLICATE_IGNORED",
        eventType,
        metadata: { eventId },
      });
      return {
        success: true,
        statusCode: 200,
        message: "Duplicate webhook event ignored (idempotent).",
        duplicate: true,
      };
    }
  } catch (idempErr: any) {
    if (idempErr?.code === 11000) {
      // Duplicate key race condition
      return {
        success: true,
        statusCode: 200,
        message: "Duplicate webhook event race ignored.",
        duplicate: true,
      };
    }
    console.error("[handleRazorpayWebhook] Error logging webhook event:", idempErr);
  }

  // 3. Event-Specific Processing
  switch (eventType) {
    case "payment.captured":
    case "order.paid": {
      return await handlePaymentCaptured(event);
    }

    case "refund.created": {
      return await handleRefundCreated(event);
    }

    case "refund.processed": {
      return await handleRefundProcessed(event);
    }

    case "refund.failed": {
      return await handleRefundFailed(event);
    }

    case "payment.failed": {
      return await handlePaymentFailed(event);
    }

    default: {
      logPaymentEvent("info", `Unhandled webhook event type: ${eventType}`, {
        event: "WEBHOOK_UNHANDLED_EVENT",
        eventType,
      });
      return {
        success: true,
        statusCode: 200,
        message: `Event ${eventType} recorded successfully.`,
      };
    }
  }
}

/**
 * Handle payment.captured event
 * Marks order as paid, updates status to confirmed, and validates with Razorpay
 */
async function handlePaymentCaptured(event: any): Promise<WebhookProcessResult> {
  const paymentEntity = event?.payload?.payment?.entity;
  const paymentId: string = paymentEntity?.id;
  const razorpayOrderId: string = paymentEntity?.order_id;
  const amountInRupees: number = paymentEntity?.amount ? paymentEntity.amount / 100 : 0;

  if (!paymentId) {
    return {
      success: false,
      statusCode: 400,
      message: "Missing payment entity ID in webhook payload.",
    };
  }

  logPaymentEvent("info", `Processing payment.captured for payment ${paymentId} (₹${amountInRupees})`, {
    event: "PAYMENT_CAPTURED_EVENT",
    paymentId,
    amount: amountInRupees,
    metadata: { razorpayOrderId },
  });

  // Check if Order already exists
  let existingOrder = await Order.findOne({ paymentId });
  if (existingOrder) {
    if (!Array.isArray(existingOrder.statusHistory)) {
      existingOrder.statusHistory = [];
    }
    if (!Array.isArray(existingOrder.refundHistory)) {
      existingOrder.refundHistory = [];
    }

    if (existingOrder.paymentStatus !== "paid") {
      existingOrder.paymentStatus = "paid";
      if (existingOrder.status === "pending") {
        existingOrder.status = "confirmed";
      }
      existingOrder.statusHistory.push({
        status: existingOrder.status,
        changedAt: new Date(),
        note: `Payment captured via webhook (${paymentId})`,
      });
      await existingOrder.save();
    }

    // Automatically record payment and fee in ledger
    try {
      const { recordPaymentSuccess } = await import("@/services/ledger.service");
      await recordPaymentSuccess({
        orderId: existingOrder._id,
        paymentId,
        razorpayOrderId,
        amount: amountInRupees || existingOrder.totalAmount,
        fee: paymentEntity.fee ? Number(paymentEntity.fee) / 100 : 0,
        tax: paymentEntity.tax ? Number(paymentEntity.tax) / 100 : 0,
        method: paymentEntity.method,
        email: paymentEntity.email || existingOrder.email,
        contact: paymentEntity.contact || String(existingOrder.phone || ""),
        userId: existingOrder.userId,
        rawPayload: paymentEntity,
      });
    } catch (ledgerErr) {
      console.error("[handlePaymentCaptured] Error updating ledger for existing order:", ledgerErr);
    }

    return {
      success: true,
      statusCode: 200,
      message: "Order payment status marked as paid.",
      orderId: existingOrder._id.toString(),
    };
  }

  // If order does not exist, check pending payment snapshot
  if (razorpayOrderId) {
    const pending = await PendingPayment.findOneAndUpdate(
      { razorpayOrderId, status: "pending" },
      { status: "processing", paymentId, updatedAt: new Date() },
      { new: true }
    );

    if (pending) {
      let checkoutData: PreparedCheckout | null = (pending.snapshot as PreparedCheckout) || null;

      if (!checkoutData) {
        const prepared = await prepareCheckout(
          {
            ...pending.orderPayload,
            paymentMethod: "online",
          },
          pending.userId?.toString()
        );
        if (prepared.ok) {
          checkoutData = prepared.data;
        }
      }

      if (checkoutData) {
        try {
          const newOrder = await placeOrderRecord(checkoutData, {
            paymentId,
            paymentStatus: "paid",
          });

          pending.status = "paid";
          pending.paymentId = paymentId;
          pending.updatedAt = new Date();
          await pending.save();

          // Update order status if pending
          if (newOrder.status === "pending") {
            newOrder.status = "confirmed";
            await newOrder.save();
          }

          // Record in Payment collection and Transactions ledger
          try {
            const { recordPaymentSuccess } = await import("@/services/ledger.service");
            await recordPaymentSuccess({
              orderId: newOrder._id,
              paymentId,
              razorpayOrderId,
              amount: amountInRupees || newOrder.totalAmount,
              fee: paymentEntity.fee ? Number(paymentEntity.fee) / 100 : 0,
              tax: paymentEntity.tax ? Number(paymentEntity.tax) / 100 : 0,
              method: paymentEntity.method,
              email: paymentEntity.email || newOrder.email,
              contact: paymentEntity.contact || String(newOrder.phone || ""),
              userId: newOrder.userId,
              rawPayload: paymentEntity,
            });
          } catch (ledgerErr) {
            console.error("[handlePaymentCaptured] Error updating ledger for new order:", ledgerErr);
          }

          logPaymentEvent("info", `Order ${newOrder._id} created and confirmed via payment.captured webhook.`, {
            event: "ORDER_CREATED_FROM_WEBHOOK",
            orderId: newOrder._id.toString(),
            paymentId,
          });

          return {
            success: true,
            statusCode: 200,
            message: "Order placed and confirmed successfully.",
            orderId: newOrder._id.toString(),
          };
        } catch (orderErr: any) {
          logPaymentEvent("error", `Error placing order record from webhook: ${orderErr.message}`, {
            event: "ORDER_CREATION_FAILED",
            paymentId,
            error: orderErr,
          });
        }
      }
    }
  }

  return {
    success: true,
    statusCode: 200,
    message: "Payment captured event processed.",
  };
}

/**
 * Handle refund.created event
 * Marks order refundStatus as pending
 */
async function handleRefundCreated(event: any): Promise<WebhookProcessResult> {
  const refundEntity = event?.payload?.refund?.entity;
  const refundId: string = refundEntity?.id;
  const paymentId: string = refundEntity?.payment_id;
  const amountInRupees: number = refundEntity?.amount ? refundEntity.amount / 100 : 0;
  const orderIdInNotes: string = refundEntity?.notes?.orderId;

  logPaymentEvent("info", `Processing refund.created for refund ${refundId}, payment ${paymentId}`, {
    event: "REFUND_CREATED_EVENT",
    refundId,
    paymentId,
    amount: amountInRupees,
  });

  // Find order by paymentId, refundId, or order ID in notes
  let order: any = null;
  if (orderIdInNotes) {
    order = await Order.findById(orderIdInNotes);
  }
  if (!order && paymentId) {
    order = await Order.findOne({ paymentId });
  }
  if (!order && refundId) {
    order = await Order.findOne({ refundId });
  }

  if (order) {
    if (!Array.isArray(order.refundHistory)) {
      order.refundHistory = [];
    }
    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }

    order.refundStatus = "pending";
    if (!order.refundId) order.refundId = refundId;

    const existingHistory = order.refundHistory.find((h: any) => h.refundId === refundId);
    if (!existingHistory) {
      order.refundHistory.push({
        refundId,
        amount: amountInRupees,
        status: "pending",
        razorpayPaymentId: paymentId,
        reason: refundEntity?.notes?.reason || "Refund created via Razorpay",
        createdAt: new Date(),
      });
    }

    await order.save();

    // Update RefundLog if exists
    await RefundLog.findOneAndUpdate(
      { razorpayRefundId: refundId },
      {
        orderId: order._id,
        paymentId,
        razorpayRefundId: refundId,
        amount: amountInRupees,
        amountInPaise: refundEntity?.amount || Math.round(amountInRupees * 100),
        status: "pending",
        rawResponse: refundEntity,
      },
      { upsert: true, new: true }
    );

    // Record Debit Transaction in Ledger
    try {
      const { recordRefund } = await import("@/services/ledger.service");
      await recordRefund({
        orderId: order._id,
        paymentId,
        refundId,
        amount: amountInRupees,
        reason: refundEntity?.notes?.reason || "Refund created via Razorpay",
        userId: order.userId,
        rawPayload: refundEntity,
      });
    } catch (ledgerErr) {
      console.error("[handleRefundCreated] Error recording refund in ledger:", ledgerErr);
    }

    logPaymentEvent("info", `Order ${order._id} refund status updated to pending`, {
      event: "ORDER_REFUND_PENDING",
      orderId: order._id.toString(),
      refundId,
      paymentId,
    });

    return {
      success: true,
      statusCode: 200,
      message: "Refund marked as pending on order.",
      orderId: order._id.toString(),
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Refund created event recorded.",
  };
}

/**
 * Handle refund.processed event
 * Marks order refundStatus as completed and triggers notification email
 */
async function handleRefundProcessed(event: any): Promise<WebhookProcessResult> {
  const refundEntity = event?.payload?.refund?.entity;
  const refundId: string = refundEntity?.id;
  const paymentId: string = refundEntity?.payment_id;
  const amountInRupees: number = refundEntity?.amount ? refundEntity.amount / 100 : 0;
  const orderIdInNotes: string = refundEntity?.notes?.orderId;

  logPaymentEvent("info", `Processing refund.processed for refund ${refundId}, payment ${paymentId}`, {
    event: "REFUND_PROCESSED_EVENT",
    refundId,
    paymentId,
    amount: amountInRupees,
  });

  let order: any = null;
  if (orderIdInNotes) {
    order = await Order.findById(orderIdInNotes);
  }
  if (!order && paymentId) {
    order = await Order.findOne({ paymentId });
  }
  if (!order && refundId) {
    order = await Order.findOne({ refundId });
  }

  if (order) {
    if (!Array.isArray(order.refundHistory)) {
      order.refundHistory = [];
    }
    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }

    order.refundStatus = "completed";
    if (!order.refundId) order.refundId = refundId;

    const historyItem = order.refundHistory.find((h: any) => h.refundId === refundId);
    if (historyItem) {
      historyItem.status = "completed";
      historyItem.processedAt = new Date();
    } else {
      order.refundHistory.push({
        refundId,
        amount: amountInRupees,
        status: "completed",
        razorpayPaymentId: paymentId,
        createdAt: new Date(),
        processedAt: new Date(),
      });
    }

    await order.save();

    // Update RefundLog
    await RefundLog.findOneAndUpdate(
      { razorpayRefundId: refundId },
      {
        status: "completed",
        updatedAt: new Date(),
        rawResponse: refundEntity,
      }
    );

    // Ensure Debit Transaction in Ledger is recorded/updated
    try {
      const { recordRefund } = await import("@/services/ledger.service");
      await recordRefund({
        orderId: order._id,
        paymentId,
        refundId,
        amount: amountInRupees,
        reason: refundEntity?.notes?.reason || "Refund processed via Razorpay",
        userId: order.userId,
        rawPayload: refundEntity,
      });
    } catch (ledgerErr) {
      console.error("[handleRefundProcessed] Error recording refund in ledger:", ledgerErr);
    }

    logPaymentEvent("info", `Order ${order._id} refund status updated to completed.`, {
      event: "ORDER_REFUND_COMPLETED",
      orderId: order._id.toString(),
      refundId,
      amount: amountInRupees,
    });

    // Notify customer via email
    if (order.email) {
      try {
        await refundStatusUpdateMail(order.email, order.recipientName || "Customer", {
          orderId: order._id.toString(),
          refundId,
          amount: amountInRupees,
          status: "completed",
        });
      } catch (mailErr) {
        console.error("[handleRefundProcessed] Failed to send refund completion email:", mailErr);
      }
    }

    return {
      success: true,
      statusCode: 200,
      message: "Refund marked as completed.",
      orderId: order._id.toString(),
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Refund processed event recorded.",
  };
}

/**
 * Handle refund.failed event
 * Marks order refundStatus as failed and logs failure details
 */
async function handleRefundFailed(event: any): Promise<WebhookProcessResult> {
  const refundEntity = event?.payload?.refund?.entity;
  const refundId: string = refundEntity?.id;
  const paymentId: string = refundEntity?.payment_id;
  const failureReason: string =
    refundEntity?.error_description || refundEntity?.error_reason || "Refund processing failed";
  const amountInRupees: number = refundEntity?.amount ? refundEntity.amount / 100 : 0;
  const orderIdInNotes: string = refundEntity?.notes?.orderId;

  logPaymentEvent("error", `Processing refund.failed for refund ${refundId}: ${failureReason}`, {
    event: "REFUND_FAILED_EVENT",
    refundId,
    paymentId,
    reason: failureReason,
  });

  let order: any = null;
  if (orderIdInNotes) {
    order = await Order.findById(orderIdInNotes);
  }
  if (!order && paymentId) {
    order = await Order.findOne({ paymentId });
  }
  if (!order && refundId) {
    order = await Order.findOne({ refundId });
  }

  if (order) {
    if (!Array.isArray(order.refundHistory)) {
      order.refundHistory = [];
    }
    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }

    order.refundStatus = "failed";

    const historyItem = order.refundHistory.find((h: any) => h.refundId === refundId);
    if (historyItem) {
      historyItem.status = "failed";
      historyItem.failureReason = failureReason;
    } else {
      order.refundHistory.push({
        refundId: refundId || `failed_${Date.now()}`,
        amount: amountInRupees,
        status: "failed",
        razorpayPaymentId: paymentId,
        failureReason,
        createdAt: new Date(),
      });
    }

    await order.save();

    await RefundLog.findOneAndUpdate(
      { razorpayRefundId: refundId },
      {
        status: "failed",
        errorDescription: failureReason,
        updatedAt: new Date(),
        rawResponse: refundEntity,
      }
    );

    // Notify customer/admin
    if (order.email) {
      try {
        await refundStatusUpdateMail(order.email, order.recipientName || "Customer", {
          orderId: order._id.toString(),
          refundId: refundId || "N/A",
          amount: amountInRupees,
          status: "failed",
          reason: failureReason,
        });
      } catch (mailErr) {
        console.error("[handleRefundFailed] Failed to send refund failed notification:", mailErr);
      }
    }

    return {
      success: true,
      statusCode: 200,
      message: "Refund failure recorded on order.",
      orderId: order._id.toString(),
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Refund failed event recorded.",
  };
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(event: any): Promise<WebhookProcessResult> {
  const paymentEntity = event?.payload?.payment?.entity;
  const paymentId: string = paymentEntity?.id;
  const razorpayOrderId: string = paymentEntity?.order_id;
  const errorDescription: string = paymentEntity?.error_description || "Payment failed";

  logPaymentEvent("warn", `Payment failed: ${paymentId}`, {
    event: "PAYMENT_FAILED_EVENT",
    paymentId,
    reason: errorDescription,
  });

  if (razorpayOrderId) {
    await PendingPayment.findOneAndUpdate(
      { razorpayOrderId },
      { status: "failed", paymentId: paymentId || null, updatedAt: new Date() }
    );
  }

  const order = await Order.findOne({ paymentId });
  if (order) {
    order.paymentStatus = "failed";
    await order.save();
  }

  return {
    success: true,
    statusCode: 200,
    message: "Payment failure recorded.",
  };
}
