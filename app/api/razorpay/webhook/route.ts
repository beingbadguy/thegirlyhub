import { databaseConnection } from "@/config/databseConnection";
import { handleRazorpayWebhook } from "@/services/webhook.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await databaseConnection();

  try {
    const signature = req.headers.get("x-razorpay-signature");
    const rawBody = await req.text();

    const result = await handleRazorpayWebhook(rawBody, signature);

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        orderId: result.orderId,
        duplicate: result.duplicate,
      },
      { status: result.statusCode }
    );
  } catch (error: any) {
    console.error("[POST /api/razorpay/webhook] Uncaught webhook handler error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
