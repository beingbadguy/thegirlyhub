import { NextRequest, NextResponse } from "next/server";
import { generateShiprocketLabel } from "@/lib/shiprocket";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";

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
      const order = await Order.findById(orderId).select("shipmentId").lean() as any;
      targetShipmentId = order?.shipmentId;
    }

    if (!targetShipmentId) {
      return NextResponse.json(
        { success: false, message: "shipmentId or orderId is required" },
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
      { success: false, message: err.message || "Failed to generate label" },
      { status: 500 }
    );
  }
}
