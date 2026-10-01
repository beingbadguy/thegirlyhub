import { NextRequest, NextResponse } from "next/server";
import { printShiprocketInvoice } from "@/lib/shiprocket";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import mongoose from "mongoose";

/**
 * POST /api/shiprocket/invoice
 * Retrieve tax invoice PDF URL for an order.
 * Accepts: { orderId, shiprocketOrderId }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, shiprocketOrderId } = body;

    let targetOrderId = shiprocketOrderId;

    if (!targetOrderId && orderId) {
      await databaseConnection();
      let order: any = null;

      if (mongoose.Types.ObjectId.isValid(orderId)) {
        order = await Order.findById(orderId)
          .select("shiprocketOrderId shipmentId orderId")
          .lean();
      }
      if (!order) {
        order = await Order.findOne({ orderId })
          .select("shiprocketOrderId shipmentId orderId")
          .lean();
      }
      if (!order) {
        order = await Order.findOne({ paymentId: orderId })
          .select("shiprocketOrderId shipmentId orderId")
          .lean();
      }

      // Check for stored shiprocketOrderId or numeric shipmentId
      if (order?.shiprocketOrderId && !isNaN(Number(order.shiprocketOrderId))) {
        targetOrderId = order.shiprocketOrderId;
      } else if (order?.orderId && !isNaN(Number(order.orderId))) {
        targetOrderId = order.orderId;
      }
    }

    // Validate that we have a valid numerical Shiprocket Order ID
    if (!targetOrderId || isNaN(Number(targetOrderId)) || Number(targetOrderId) <= 0) {
      return NextResponse.json(
        {
          success: false,
          invoice_url: "",
          message:
            "Cannot print invoice: No active Shiprocket order ID found for this order. Please book a shipment with Shiprocket first.",
        },
        { status: 400 }
      );
    }

    const printRes = await printShiprocketInvoice([targetOrderId]);
    return NextResponse.json(printRes, { status: printRes.success ? 200 : 400 });
  } catch (err: any) {
    console.error("[POST /api/shiprocket/invoice] Error:", err);
    return NextResponse.json(
      { success: false, invoice_url: "", message: err.message || "Failed to print invoice" },
      { status: 500 }
    );
  }
}
