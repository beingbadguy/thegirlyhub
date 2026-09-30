import { NextRequest, NextResponse } from "next/server";
import { getNimbusPostToken } from "@/lib/nimbuspost";

/**
 * POST /api/nimbuspost/auth
 * Generates or retrieves cached NimbusPost authentication token.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const forceRefresh = Boolean(body?.forceRefresh);

    const token = await getNimbusPostToken(forceRefresh);

    return NextResponse.json(
      {
        success: true,
        token,
        cached: !forceRefresh,
        message: "NimbusPost authentication token retrieved successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/nimbuspost/auth] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to authenticate with NimbusPost",
      },
      { status: 500 }
    );
  }
}
