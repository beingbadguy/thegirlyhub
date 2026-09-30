import { NextRequest, NextResponse } from "next/server";
import { trackShiprocketShipment } from "@/lib/shiprocket";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";

/**
 * GET /api/shiprocket/track?awb=... or ?orderId=...
 * Live tracking of a shipment via Shiprocket.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let awb = searchParams.get("awb")?.trim();
    const orderId = searchParams.get("orderId")?.trim();

    if (!awb && orderId) {
      await databaseConnection();
      const order = await Order.findById(orderId).select("awbCode awbNumber trackingLink").lean() as any;
      awb = order?.awbCode || order?.awbNumber;
    }

    if (!awb) {
      return NextResponse.json(
        { success: false, message: "awb or orderId query parameter is required" },
        { status: 400 }
      );
    }

    const trackingData = await trackShiprocketShipment(awb);

    return NextResponse.json(
      {
        success: true,
        awb,
        tracking: trackingData,
        trackingLink: `https://shiprocket.co/tracking/${awb}`,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[GET /api/shiprocket/track] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to track shipment" },
      { status: 500 }
    );
  }
}
