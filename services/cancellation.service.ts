import Order from "@/models/order.model";
import Product from "@/models/product.model";
import RefundLog from "@/models/refundLog.model";
import { triggerRazorpayRefund, fetchPaymentDetails } from "./razorpay.service";
import { logPaymentEvent } from "@/lib/logger";
import { orderCancelledMail } from "./sendMail";
import mongoose from "mongoose";

export interface CancelOrderParams {
  orderId: string;
  reason?: string;
  refundAmount?: number; // Optional custom partial refund amount in Rupees
  requestedBy?: "customer" | "admin" | "system";
  userId?: string | null;
  userRole?: string | null;
  ip?: string | null;
}

export interface CancelOrderResult {
  success: boolean;
  message: string;
  order?: any;
  refund?: any;
  statusCode: number;
}

/**
 * Production-ready Order Cancellation and Refund Orchestrator
 */
export async function cancelOrder(params: CancelOrderParams): Promise<CancelOrderResult> {
  const {
    orderId,
    reason = "Customer requested cancellation",
    refundAmount: customRefundAmount,
    requestedBy = "customer",
    userId,
    userRole,
    ip,
  } = params;

  if (!orderId) {
    return {
      success: false,
      message: "Order ID is required for cancellation.",
      statusCode: 400,
    };
  }

  // 1. Fetch Order
  let order: any = null;
  if (mongoose.Types.ObjectId.isValid(orderId)) {
    order = await Order.findById(orderId);
  } else {
    order = await Order.findOne({ paymentId: orderId });
  }

  if (!order) {
    logPaymentEvent("warn", `Cancellation failed: Order ${orderId} not found.`, {
      event: "ORDER_CANCEL_NOT_FOUND",
      orderId,
      userId,
      ip,
    });
    return {
      success: false,
      message: "Order not found.",
      statusCode: 404,
    };
  }

  // Ensure array fields exist on legacy documents
  if (!Array.isArray(order.refundHistory)) {
    order.refundHistory = [];
  }
  if (!Array.isArray(order.statusHistory)) {
    order.statusHistory = [];
  }

  // 2. Security & Authorization check
  const isAdmin = userRole === "admin" || requestedBy === "admin";
  const isOwner =
    userId && order.userId && order.userId.toString() === userId.toString();

  if (!isAdmin && !isOwner && requestedBy !== "system") {
    // If user is guest, cancellation without auth or email/phone verification must be guarded
    if (order.userId && !userId) {
      logPaymentEvent("warn", `Unauthorized cancellation attempt on order ${orderId}`, {
        event: "ORDER_CANCEL_UNAUTHORIZED",
        orderId,
        userId,
        ip,
      });
      return {
        success: false,
        message: "You are not authorized to cancel this order.",
        statusCode: 403,
      };
    }
  }

  // 3. Status Validation: Only allow cancel if order not shipped / delivered / completed / already cancelled
  if (order.status === "cancelled") {
    return {
      success: false,
      message: "This order is already cancelled.",
      statusCode: 400,
    };
  }

  const nonCancellableStatuses = ["shipped", "delivered", "completed"];
  if (nonCancellableStatuses.includes(order.status)) {
    logPaymentEvent("warn", `Cancellation rejected: Order ${orderId} is in non-cancellable state (${order.status}).`, {
      event: "ORDER_CANCEL_INVALID_STATE",
      orderId,
      status: order.status,
      userId,
    });
    return {
      success: false,
      message: `Order cannot be cancelled because it has already been ${order.status}.`,
      statusCode: 400,
    };
  }

  // 4. Duplicate Refund Prevention & Refund Calculation
  const isOnlinePayment = order.paymentMethod === "online" || order.paymentStatus === "paid";
  const hasPaid = order.paymentStatus === "paid" && Boolean(order.paymentId);
  let refundData: any = null;
  let calculatedRefundAmount = 0;

  if (hasPaid) {
    // Check if full refund was already processed
    const alreadyRefunded = Number(order.refundAmount || 0);
    const maxRefundable = Math.max(0, order.totalAmount - alreadyRefunded);

    if (maxRefundable <= 0 && order.refundStatus === "completed") {
      logPaymentEvent("warn", `Cancellation warning: Order ${orderId} already fully refunded.`, {
        event: "DUPLICATE_REFUND_BLOCKED",
        orderId,
        paymentId: order.paymentId,
      });
      return {
        success: false,
        message: "A full refund has already been completed for this order.",
        statusCode: 400,
      };
    }

    if (order.refundStatus === "pending") {
      logPaymentEvent("warn", `Cancellation warning: Refund for order ${orderId} is currently pending processing.`, {
        event: "PENDING_REFUND_IN_PROGRESS",
        orderId,
        paymentId: order.paymentId,
      });
      return {
        success: false,
        message: "A refund is already in progress for this order.",
        statusCode: 400,
      };
    }

    // Determine refund amount (Full refund by default, support partial refund)
    if (customRefundAmount !== undefined && customRefundAmount !== null) {
      const parsedAmount = Number(customRefundAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return {
          success: false,
          message: "Invalid refund amount provided.",
          statusCode: 400,
        };
      }
      if (parsedAmount > maxRefundable) {
        return {
          success: false,
          message: `Refund amount (₹${parsedAmount}) cannot exceed refundable balance (₹${maxRefundable}).`,
          statusCode: 400,
        };
      }
      calculatedRefundAmount = parsedAmount;
    } else {
      // Default: Full remaining refundable amount
      calculatedRefundAmount = maxRefundable;
    }

    // 5. Trigger Razorpay Refund API
    const refundResponse = await triggerRazorpayRefund({
      paymentId: order.paymentId,
      orderId: order._id.toString(),
      amountInRupees: calculatedRefundAmount,
      reason,
      receipt: `rcpt_${order._id.toString().slice(-8)}_${Date.now().toString().slice(-4)}`,
      notes: {
        orderId: order._id.toString(),
        cancelledBy: requestedBy,
        reason,
      },
    });

    if (!refundResponse.success) {
      logPaymentEvent("error", `Razorpay refund failed during cancellation of order ${orderId}`, {
        event: "ORDER_CANCEL_REFUND_FAILED",
        orderId,
        paymentId: order.paymentId,
        amount: calculatedRefundAmount,
        error: refundResponse.error,
      });

      // Update order with failed refund record for admin investigation
      order.refundStatus = "failed";
      order.refundHistory.push({
        refundId: `failed_${Date.now()}`,
        amount: calculatedRefundAmount,
        status: "failed",
        razorpayPaymentId: order.paymentId,
        reason,
        failureReason: refundResponse.error || "Razorpay API error",
        createdAt: new Date(),
      });
      await order.save();

      return {
        success: false,
        message: `Cancellation aborted: Razorpay refund failed (${refundResponse.error}).`,
        statusCode: 502,
      };
    }

    // Create RefundLog Document
    try {
      await RefundLog.create({
        orderId: order._id,
        paymentId: order.paymentId,
        razorpayRefundId: refundResponse.refundId,
        amount: refundResponse.amountInRupees || calculatedRefundAmount,
        amountInPaise: refundResponse.amountInPaise || Math.round(calculatedRefundAmount * 100),
        currency: "INR",
        status: refundResponse.status || "pending",
        reason,
        speed: "optimum",
        initiatedBy: requestedBy,
        userId: order.userId || undefined,
        rawResponse: refundResponse.raw,
      });
    } catch (logErr) {
      console.error("[cancelOrder] Error creating RefundLog record:", logErr);
    }

    // Record Debit Transaction in Ledger
    try {
      const { recordRefund } = await import("@/services/ledger.service");
      await recordRefund({
        orderId: order._id,
        paymentId: order.paymentId,
        refundId: refundResponse.refundId || `rfnd_${Date.now()}`,
        amount: refundResponse.amountInRupees || calculatedRefundAmount,
        reason,
        userId: order.userId,
        rawPayload: refundResponse.raw,
      });
    } catch (ledgerErr) {
      console.error("[cancelOrder] Error creating debit ledger entry:", ledgerErr);
    }

    // Update order refund fields
    order.refundId = refundResponse.refundId;
    order.refundAmount = alreadyRefunded + (refundResponse.amountInRupees || calculatedRefundAmount);
    order.refundStatus = refundResponse.status || "pending";
    order.refundReason = reason;
    order.refundHistory.push({
      refundId: refundResponse.refundId,
      amount: refundResponse.amountInRupees || calculatedRefundAmount,
      status: refundResponse.status || "pending",
      razorpayPaymentId: order.paymentId,
      speed: "optimum",
      reason,
      createdAt: new Date(),
      processedAt: refundResponse.status === "completed" ? new Date() : undefined,
    });
  }

  // 6. Restock Products Atomically
  if (Array.isArray(order.products) && order.products.length > 0) {
    for (const item of order.products) {
      if (item.productId && item.quantity > 0) {
        try {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: {
              sold: -item.quantity,
              countInStock: item.quantity,
              stock: item.quantity,
              totalStock: item.quantity,
            },
          });
          logPaymentEvent("info", `Restocked ${item.quantity} units for product ${item.productId}`, {
            event: "STOCK_RESTOCKED",
            orderId: order._id.toString(),
            productId: item.productId.toString(),
            quantity: item.quantity,
          });
        } catch (stockErr) {
          console.error(`[cancelOrder] Failed to restock product ${item.productId}:`, stockErr);
        }
      }
    }
  }

  // 7. Update Order State
  order.status = "cancelled";
  order.cancellationReason = reason;
  order.cancelledAt = new Date();
  order.updatedAt = new Date();

  order.statusHistory.push({
    status: "cancelled",
    changedAt: new Date(),
    note: `Order cancelled by ${requestedBy}. Reason: ${reason}`,
  });

  await order.save();

  logPaymentEvent("info", `Order ${orderId} successfully cancelled.`, {
    event: "ORDER_CANCEL_SUCCESS",
    orderId: order._id.toString(),
    paymentId: order.paymentId,
    refundStatus: order.refundStatus,
    refundAmount: order.refundAmount,
    requestedBy,
    userId,
  });

  // 8. Send Cancellation Notification Email
  if (order.email) {
    try {
      await orderCancelledMail(order.email, order.recipientName || "Customer", {
        orderId: order._id.toString(),
        reason,
        refundAmount: calculatedRefundAmount,
        refundStatus: order.refundStatus,
        isOnlinePayment: hasPaid,
      });
    } catch (mailErr) {
      console.error("[cancelOrder] Failed to dispatch cancellation email:", mailErr);
    }
  }

  return {
    success: true,
    message: "Order has been cancelled successfully.",
    order,
    refund: refundData,
    statusCode: 200,
  };
}
