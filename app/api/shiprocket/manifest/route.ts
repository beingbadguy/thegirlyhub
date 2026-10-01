import { NextRequest, NextResponse } from "next/server";
import { generateShiprocketManifest, printShiprocketManifest } from "@/lib/shiprocket";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import mongoose from "mongoose";

/**
 * POST /api/shiprocket/manifest
 * Generate and/or retrieve print URL for a manifest.
 * Accepts: { shipmentId, orderId, action: "generate" | "print" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { shipmentId, orderId, action = "print" } = body;

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
          manifest_url: "",
          message:
            "Cannot generate or print manifest: No valid Shiprocket shipment found for this order. Please book a shipment using 'Ship with Shiprocket' first.",
        },
        { status: 400 }
      );
    }

    if (action === "generate") {
      const genRes = await generateShiprocketManifest([targetShipmentId]);
      return NextResponse.json(genRes, { status: genRes.success ? 200 : 400 });
    }

    // Default: print manifest
    const printRes = await printShiprocketManifest([targetShipmentId]);
    return NextResponse.json(printRes, { status: printRes.success ? 200 : 400 });
  } catch (err: any) {
    console.error("[POST /api/shiprocket/manifest] Error:", err);
    return NextResponse.json(
      { success: false, manifest_url: "", message: err.message || "Failed to process manifest" },
      { status: 500 }
    );
  }
}
