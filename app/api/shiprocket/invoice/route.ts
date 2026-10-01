import { NextRequest, NextResponse } from "next/server";
import { printShiprocketInvoice } from "@/lib/shiprocket";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";

/**
 * POST /api/shiprocket/invoice
 * Retrieve tax invoice PDF URL for an order.
 * Accepts: { orderId, shiprocketOrderId }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, shiprocketOrderId } = body;

    let targetOrderId = shiprocketOrderId || orderId;

    if (!targetOrderId && orderId) {
      await databaseConnection();
      const order = (await Order.findById(orderId).select("orderId").lean()) as any;
      targetOrderId = order?.orderId || orderId;
    }

    if (!targetOrderId) {
      return NextResponse.json(
        { success: false, message: "orderId is required" },
        { status: 400 }
      );
    }

    const printRes = await printShiprocketInvoice([targetOrderId]);
    return NextResponse.json(printRes, { status: printRes.success ? 200 : 400 });
  } catch (err: any) {
    console.error("[POST /api/shiprocket/invoice] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to print invoice" },
      { status: 500 }
    );
  }
}
