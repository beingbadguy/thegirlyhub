import { NextRequest, NextResponse } from "next/server";
import {
  getShypliteToken,
  getShypliteConfig,
  areShypliteCredentialsConfigured,
} from "@/lib/shyplite";

/**
 * GET /api/shyplite/auth
 * Returns health status of Shyplite API credentials (appId, secretKey, sellerId, warehouse, mode).
 */
export async function GET() {
  try {
    const config = getShypliteConfig();
    const token = await getShypliteToken(false);
    const isSimulated = token.startsWith("mock_");

    return NextResponse.json(
      {
        success: true,
        configured: config.isConfigured,
        hasAppId: config.hasAppId,
        hasSecretKey: config.hasSecretKey,
        maskedAppId: config.maskedAppId,
        warehouseName: config.warehouseName,
        pickupPincode: config.pickupPincode,
        mode: isSimulated ? "simulated" : "live",
        message: isSimulated
          ? `High-fidelity test sandbox active with configured App ID (${config.maskedAppId})`
          : "Connected directly to live Shyplite API gateway",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/shyplite/auth] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to inspect Shyplite configuration",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shyplite/auth
 * Generates or retrieves cached Shyplite authentication token / signature.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const forceRefresh = Boolean(body?.forceRefresh);

    const token = await getShypliteToken(forceRefresh);
    const config = getShypliteConfig();

    return NextResponse.json(
      {
        success: true,
        token,
        cached: !forceRefresh,
        hasAppId: config.hasAppId,
        hasSecretKey: config.hasSecretKey,
        maskedAppId: config.maskedAppId,
        isSimulated: token.startsWith("mock_"),
        message: "Shyplite authentication token retrieved successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/shyplite/auth] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to authenticate with Shyplite",
      },
      { status: 500 }
    );
  }
}
