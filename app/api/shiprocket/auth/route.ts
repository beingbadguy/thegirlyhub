import { NextRequest, NextResponse } from "next/server";
import { getShiprocketToken } from "@/lib/shiprocket";

/**
 * POST /api/shiprocket/auth
 * Generates or retrieves cached Shiprocket JWT auth token.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const forceRefresh = Boolean(body?.forceRefresh);

    const token = await getShiprocketToken(forceRefresh);

    return NextResponse.json(
      {
        success: true,
        token,
        cached: !forceRefresh,
        message: "Shiprocket authentication token retrieved successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/shiprocket/auth] Auth error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to authenticate with Shiprocket",
      },
      { status: 500 }
    );
  }
}
