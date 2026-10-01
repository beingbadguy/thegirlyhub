import { NextRequest, NextResponse } from "next/server";
import { generateShiprocketPickup, isPlaceholderShiprocketAwb } from "@/lib/shiprocket";
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
    let order: any = null;

    if (orderId) {
      await databaseConnection();

      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId).select("shipmentId awbCode awbNumber").lean();
      }
      if (!order) {
        order = await Order.findOne({ orderId }).select("shipmentId awbCode awbNumber").lean();
      }
      if (!order) {
        order = await Order.findOne({ paymentId: orderId }).select("shipmentId awbCode awbNumber").lean();
      }

      if (!targetShipmentId) {
        targetShipmentId = order?.shipmentId;
      }

      const awb = order?.awbCode || order?.awbNumber;
      if (awb && isPlaceholderShiprocketAwb(awb)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This order only has a placeholder AWB (not assigned by Shiprocket). Recreate the shipment so a live AWB is assigned, then request pickup.",
          },
          { status: 400 }
        );
      }
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

    if (res.success && orderId) {
      try {
        await databaseConnection();
        const query = mongoose.Types.ObjectId.isValid(orderId)
          ? { $or: [{ _id: orderId }, { orderId }, { paymentId: orderId }] }
          : { $or: [{ orderId }, { paymentId: orderId }] };
        await Order.findOneAndUpdate(query, {
          $set: {
            pickupStatus: "scheduled",
            pickupMessage: res.message,
          },
        });
      } catch (updateErr) {
        console.warn("[POST /api/shiprocket/pickup] Could not persist pickup status:", updateErr);
      }
    }

    return NextResponse.json(res, { status: res.success ? 200 : 400 });
  } catch (err: any) {
    console.error("[POST /api/shiprocket/pickup] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to schedule pickup" },
      { status: 500 }
    );
  }
}
