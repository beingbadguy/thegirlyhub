import { NextRequest, NextResponse } from "next/server";
import { generateShiprocketLabel } from "@/lib/shiprocket";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import mongoose from "mongoose";

/**
 * POST /api/shiprocket/label
 * Generate or re-fetch a shipping label PDF URL for an existing shipment.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { shipmentId, orderId } = body;

    let targetShipmentId = shipmentId;

    if (!targetShipmentId && orderId) {
      await databaseConnection();
      let order: any = null;

      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId).select("shipmentId labelUrl").lean();
      }
      if (!order) {
        order = await Order.findOne({ orderId }).select("shipmentId labelUrl").lean();
      }
      if (!order) {
        order = await Order.findOne({ paymentId: orderId }).select("shipmentId labelUrl").lean();
      }

      targetShipmentId = order?.shipmentId;
    }

    if (!targetShipmentId || isNaN(Number(targetShipmentId)) || Number(targetShipmentId) <= 0) {
      return NextResponse.json(
        {
          success: false,
          labelUrl: "",
          message:
            "Cannot fetch shipping label: No valid Shiprocket shipment found for this order. Please book a shipment using 'Ship with Shiprocket' first.",
        },
        { status: 400 }
      );
    }

    const labelUrl = await generateShiprocketLabel(targetShipmentId);

    return NextResponse.json(
      {
        success: true,
        labelUrl,
        shipmentId: targetShipmentId,
        message: "Label URL fetched successfully",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[POST /api/shiprocket/label] Error:", err);
    return NextResponse.json(
      { success: false, labelUrl: "", message: err.message || "Failed to generate label" },
      { status: 500 }
    );
  }
}
