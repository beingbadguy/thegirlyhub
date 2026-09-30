import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import { generateShypliteLabel } from "@/lib/shyplite";
import mongoose from "mongoose";

/**
 * POST /api/shyplite/label
 * Fetches printable shipping label PDF for an order or shipmentId via Shyplite
 */
export async function POST(req: NextRequest) {
  await databaseConnection();

  try {
    const body = await req.json().catch(() => ({}));
    const shipmentId = body?.shipmentId;
    const orderId = body?.orderId;

    if (!shipmentId && !orderId) {
      return NextResponse.json(
        { success: false, message: "Either shipmentId or orderId is required" },
        { status: 400 }
      );
    }

    let resolvedShipmentId = shipmentId;
    let order: any = null;

    if (!resolvedShipmentId && orderId) {
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId);
      }
      if (!order) {
        order = await Order.findOne({ orderId });
      }

      if (order?.labelUrl) {
        return NextResponse.json(
          {
            success: true,
            labelUrl: order.labelUrl,
            cached: true,
          },
          { status: 200 }
        );
      }

      resolvedShipmentId = order?.shipmentId || order?.awbCode;
    }

    if (!resolvedShipmentId) {
      return NextResponse.json(
        { success: false, message: "Order does not have an active shipment ID or AWB" },
        { status: 400 }
      );
    }

    const labelUrl = await generateShypliteLabel(resolvedShipmentId);

    if (order && !order.labelUrl) {
      order.labelUrl = labelUrl;
      await order.save();
    }

    return NextResponse.json(
      {
        success: true,
        labelUrl,
        shipmentId: resolvedShipmentId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/shyplite/label] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate label from Shyplite",
      },
      { status: 500 }
    );
  }
}
