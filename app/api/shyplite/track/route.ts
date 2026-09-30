import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import { trackShypliteShipment } from "@/lib/shyplite";
import mongoose from "mongoose";

/**
 * GET /api/shyplite/track?awb=...&orderId=...
 * Live shipment tracking status from Shyplite
 */
export async function GET(req: NextRequest) {
  await databaseConnection();

  try {
    const { searchParams } = new URL(req.url);
    let awb = searchParams.get("awb")?.trim();
    const orderId = searchParams.get("orderId")?.trim();

    if (!awb && orderId) {
      let order: any = null;
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId);
      }
      if (!order) {
        order = await Order.findOne({ orderId });
      }
      awb = order?.awbCode || order?.awbNumber;
    }

    if (!awb) {
      return NextResponse.json(
        { success: false, message: "AWB number or valid orderId is required" },
        { status: 400 }
      );
    }

    const trackingData = await trackShypliteShipment(awb);

    return NextResponse.json(
      {
        success: true,
        awb,
        tracking: trackingData,
        trackingLink: `https://shyplite.com/tracking?awb=${awb}`,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/shyplite/track] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch tracking details from Shyplite",
      },
      { status: 500 }
    );
  }
}
