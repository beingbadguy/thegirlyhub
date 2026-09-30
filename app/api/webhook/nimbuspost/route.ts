import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import { mapNimbusPostStatusToInternal } from "@/lib/nimbuspost";
import mongoose from "mongoose";

/**
 * POST /api/webhook/nimbuspost
 * Webhook receiver for NimbusPost tracking events:
 * Updates order status on:
 * - Shipped / In Transit / Out for delivery
 * - Delivered
 * - RTO (Return to Origin)
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

    console.log("[NimbusPost Webhook] Received event:", {
      awb: payload.awb || payload.awb_number,
      status: payload.current_status || payload.status,
      order_id: payload.order_id || payload.order_number,
      shipment_id: payload.shipment_id,
    });

    const awb = String(payload.awb || payload.awb_number || "").trim();
    const shipmentId = String(payload.shipment_id || "").trim();
    const orderId = String(payload.order_id || payload.order_number || "").trim();
    const currentStatus = String(payload.current_status || payload.status || "");

    if (!awb && !shipmentId && !orderId) {
      return NextResponse.json(
        { success: false, message: "Missing AWB, shipment_id, or order_id in webhook" },
        { status: 400 }
      );
    }

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
        `[NimbusPost Webhook] Order not found for AWB: ${awb}, ShipmentId: ${shipmentId}, OrderId: ${orderId}`
      );
      return NextResponse.json(
        { success: true, message: "Order not found in DB; event acknowledged" },
        { status: 200 }
      );
    }

    const mapped = mapNimbusPostStatusToInternal(currentStatus);

    order.shipmentStatus = mapped.shipmentStatus;
    order.status = mapped.orderStatus;

    if (payload.courier_name && !order.courierName) {
      order.courierName = payload.courier_name;
    }

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
      `[NimbusPost Webhook] Order ${order._id} updated: shipmentStatus: ${mapped.shipmentStatus}, status: ${mapped.orderStatus}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Order status updated successfully from NimbusPost webhook",
        orderId: order._id,
        newShipmentStatus: order.shipmentStatus,
        newOrderStatus: order.status,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[NimbusPost Webhook] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
