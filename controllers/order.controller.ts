import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import {
  validateStatusTransition,
  OrderStatus,
} from "@/utils/orderStatus.utils";
import { sendOrderShippedEmail } from "@/services/orderMail.service";

/**
 * PATCH /api/orders/:id/status
 *
 * Updates the status of an order. Admin-only.
 *
 * Body: { status, awbNumber?, trackingLink? }
 */
export class OrderController {
  static async updateStatus(
    request: NextRequest,
    orderId: string
  ): Promise<NextResponse> {
    // ── 1. Admin Auth Guard ────────────────────────────────────────────────
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Admin privileges required.",
        },
        { status: 401 }
      );
    }

    // ── 2. DB Connection ───────────────────────────────────────────────────
    await databaseConnection();

    // ── 3. Parse & Validate Request Body ──────────────────────────────────
    let body: { status?: string; awbNumber?: string; trackingLink?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { status: newStatus, awbNumber, trackingLink } = body;

    // Validate new status is a known value
    const VALID_STATUSES: OrderStatus[] = [
      "processing",
      "reviewing",
      "preparing",
      "shipped",
      "delivered",
      "completed",
      "cancelled",
    ];

    if (!newStatus || !VALID_STATUSES.includes(newStatus as OrderStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status value. Must be one of: ${VALID_STATUSES.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // SHIPPED requires an AWB number
    if (newStatus === "shipped") {
      if (!awbNumber || awbNumber.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            message: "awbNumber is required when transitioning to SHIPPED status.",
          },
          { status: 400 }
        );
      }
    }

    // ── 4. Fetch Order ─────────────────────────────────────────────────────
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    // ── 5. Validate Status Transition ──────────────────────────────────────
    const transitionResult = validateStatusTransition(
      order.status as OrderStatus,
      newStatus as OrderStatus
    );

    if (!transitionResult.valid) {
      return NextResponse.json(
        { success: false, message: transitionResult.message },
        { status: 422 }
      );
    }

    // ── 6. Apply Status Update ─────────────────────────────────────────────
    // Push previous status into history (initialize array if missing on legacy documents)
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: newStatus,
      changedAt: new Date(),
    });

    order.status = newStatus;
    order.updatedAt = new Date();

    // Persist shipping details
    if (newStatus === "shipped") {
      order.awbNumber = awbNumber!.trim();
      order.trackingLink = trackingLink?.trim() || null;
    }

    await order.save();

    // ── 7. Email Trigger for SHIPPED ──────────────────────────────────────
    if (newStatus === "shipped") {
      const customerEmail = order.email;
      if (customerEmail) {
        // Fire-and-forget — don't block the response on email delivery
        sendOrderShippedEmail({
          to: customerEmail,
          recipientName: order.recipientName,
          orderId: order._id.toString(),
          awbNumber: order.awbNumber,
          trackingLink: order.trackingLink || `https://tracking.delhivery.com/${order.awbNumber}`,
          products: order.products,
          totalAmount: order.totalAmount,
        }).catch((err) =>
          console.error("[OrderController] Failed to send shipped email:", err)
        );
      }
    }

    // ── 8. Success Response ────────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        message: `Order status updated to "${newStatus}" successfully.`,
        data: {
          orderId: order._id,
          status: order.status,
          awbNumber: order.awbNumber,
          trackingLink: order.trackingLink,
          statusHistory: order.statusHistory,
          updatedAt: order.updatedAt,
        },
      },
      { status: 200 }
    );
  }
}
