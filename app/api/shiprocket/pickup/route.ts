import { NextRequest, NextResponse } from "next/server";
import { generateShiprocketPickup } from "@/lib/shiprocket";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";

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
      const order = (await Order.findById(orderId).select("shipmentId").lean()) as any;
      targetShipmentId = order?.shipmentId;
    }

    if (!targetShipmentId) {
      return NextResponse.json(
        { success: false, message: "shipmentId or orderId is required" },
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
