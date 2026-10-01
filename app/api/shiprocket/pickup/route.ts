import { NextRequest, NextResponse } from "next/server";
import { generateShiprocketPickup } from "@/lib/shiprocket";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import mongoose from "mongoose";

/**
 * POST /api/shiprocket/pickup
 * Schedule pickup request for a shipment.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { shipmentId, orderId, pickupDate } = body;

    let targetShipmentId = shipmentId;

    if (!targetShipmentId && orderId) {
      await databaseConnection();
      let order: any = null;

      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId).select("shipmentId").lean();
      }
      if (!order) {
        order = await Order.findOne({ orderId }).select("shipmentId").lean();
      }
      if (!order) {
        order = await Order.findOne({ paymentId: orderId }).select("shipmentId").lean();
      }

      targetShipmentId = order?.shipmentId;
    }

    if (!targetShipmentId || isNaN(Number(targetShipmentId)) || Number(targetShipmentId) <= 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot schedule pickup: No valid Shiprocket shipment found for this order. Please book a shipment using 'Ship with Shiprocket' first.",
        },
        { status: 400 }
      );
    }

    const res = await generateShiprocketPickup([targetShipmentId], pickupDate);

    return NextResponse.json(res, { status: res.success ? 200 : 400 });
  } catch (err: any) {
    console.error("[POST /api/shiprocket/pickup] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to schedule pickup" },
      { status: 500 }
    );
  }
}
