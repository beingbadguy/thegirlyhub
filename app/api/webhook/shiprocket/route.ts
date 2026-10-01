import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import { mapShiprocketStatusToInternal } from "@/lib/shiprocket";
import mongoose from "mongoose";

/**
 * POST /api/webhook/shiprocket
 * Webhook receiver for Shiprocket shipment events:
 * Handles real-time status updates:
 * - Shipped / In Transit / Out for delivery
 * - Delivered
 * - RTO (Return to Origin / RTO Initiated / RTO Delivered)
 */
export async function POST(req: NextRequest) {
  await databaseConnection();

  try {
    const payload = await req.json().catch(() => null);

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    console.log("[Shiprocket Webhook] Received event:", {
      awb: payload.awb,
      current_status: payload.current_status,
      order_id: payload.order_id,
      shipment_id: payload.shipment_id,
    });

    const awb = String(payload.awb || "").trim();
    const shipmentId = String(payload.shipment_id || "").trim();
    const orderId = String(payload.order_id || "").trim();
    const currentStatus = String(payload.current_status || payload.status || "");

    if (!awb && !shipmentId && !orderId) {
      return NextResponse.json(
        { success: false, message: "Missing AWB, shipment_id, or order_id in webhook" },
        { status: 400 }
      );
    }

    // Find corresponding order in DB
    const queryConditions: any[] = [];
    if (awb) {
      queryConditions.push({ awbCode: awb });
      queryConditions.push({ awbNumber: awb });
    }
    if (shipmentId) {
      queryConditions.push({ shipmentId });
    }
    if (orderId) {
      queryConditions.push({ orderId });
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        queryConditions.push({ _id: orderId });
      }
    }

    const order = await Order.findOne({ $or: queryConditions });

    if (!order) {
      console.warn(
        `[Shiprocket Webhook] Order not found for AWB: ${awb}, ShipmentId: ${shipmentId}, OrderId: ${orderId}`
      );
      // Return 200 so Shiprocket does not endlessly retry unmapped events
      return NextResponse.json(
        { success: true, message: "Order not found in database; event acknowledged." },
        { status: 200 }
      );
    }

    // Map Shiprocket status to internal status
    const mapped = mapShiprocketStatusToInternal(currentStatus);

    const prevShipmentStatus = order.shipmentStatus;
    const prevOrderStatus = order.status;

    order.shipmentStatus = mapped.shipmentStatus;
    order.status = mapped.orderStatus;

    if (payload.courier_name && !order.courierName) {
      order.courierName = payload.courier_name;
    }

    // Record scan activity in statusHistory
    if (!Array.isArray(order.statusHistory)) {
      order.statusHistory = [];
    }

    const latestScan = Array.isArray(payload.scans) && payload.scans.length > 0
      ? payload.scans[payload.scans.length - 1]
      : null;

    const note = latestScan
      ? `${mapped.note} - [${latestScan.location || "Transit Hub"}]: ${latestScan.activity || ""}`
      : mapped.note;

    order.statusHistory.push({
      status: mapped.orderStatus,
      changedAt: latestScan?.date ? new Date(latestScan.date) : new Date(),
      note,
    });

    await order.save();

    console.log(
      `[Shiprocket Webhook] Order ${order._id} updated: shipmentStatus: ${prevShipmentStatus} -> ${mapped.shipmentStatus}, status: ${prevOrderStatus} -> ${mapped.orderStatus}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Order status updated successfully from Shiprocket webhook",
        orderId: order._id,
        newShipmentStatus: order.shipmentStatus,
        newOrderStatus: order.status,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Shiprocket Webhook] Processing error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
