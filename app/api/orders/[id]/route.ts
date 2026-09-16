import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Order from "@/models/order.model";
import { OrderStatusMail } from "@/services/sendMail";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await databaseConnection();
  try {
    const { id } = await context.params;

    // Security Guard: Admin Authentication Check
    const decoded = await fetchTokenDetails(req);
    if (!decoded || decoded.role !== "admin") {
      console.warn(
        `[PUT /api/orders/${id}] Security alert: Unauthorized attempt to modify order status`,
        {
          orderId: id,
          ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
          user: decoded?.userId || "anonymous",
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { message: "Unauthorized. Admin privileges required.", success: false },
        { status: 401 }
      );
    }

    const { status } = await req.json();

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { message: "A valid status string is required.", success: false },
        { status: 400 }
      );
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("userId");

    if (!order) {
      console.warn(`[PUT /api/orders/${id}] Order not found for status update by admin ${decoded.userId}`);
      return NextResponse.json({ message: "Order not found", success: false }, { status: 404 });
    }

    console.log(`[PUT /api/orders/${id}] Order status updated successfully by admin ${decoded.userId}`, {
      orderId: id,
      adminId: decoded.userId,
      newStatus: status,
      timestamp: new Date().toISOString(),
    });

    try {
      if (order.userId?.email) {
        await OrderStatusMail(order.userId.email, order._id, status);
      }
    } catch (mailErr) {
      console.error(`[PUT /api/orders/${id}] Failed to send order status mail:`, mailErr);
    }

    return NextResponse.json(
      { message: "Status updated", order, success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PUT /api/orders/:id] Server error updating order:", error);
    return NextResponse.json(
      { message: "Failed to update order", success: false },
      { status: 500 }
    );
  }
}

