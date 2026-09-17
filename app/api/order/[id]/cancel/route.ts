import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { cancelOrder } from "@/services/cancellation.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await databaseConnection();

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required." },
        { status: 400 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
      body = {};
    }

    const { reason, refundAmount } = body;
    const decoded = await fetchTokenDetails(request);
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const result = await cancelOrder({
      orderId: id,
      reason: typeof reason === "string" ? reason.trim() : undefined,
      refundAmount: typeof refundAmount === "number" ? refundAmount : undefined,
      requestedBy: decoded?.role === "admin" ? "admin" : "customer",
      userId: decoded?.userId || null,
      userRole: decoded?.role || null,
      ip: clientIp,
    });

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        order: result.order,
        refund: result.refund,
      },
      { status: result.statusCode }
    );
  } catch (error: any) {
    console.error("[POST /api/order/:id/cancel] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal server error during order cancellation.",
      },
      { status: 500 }
    );
  }
}
