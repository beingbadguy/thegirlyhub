import { NextRequest, NextResponse } from "next/server";
import {
  getNimbusPostToken,
  getNimbusPostConfig,
  areNimbusPostCredentialsConfigured,
} from "@/lib/nimbuspost";

/**
 * GET /api/nimbuspost/auth
 * Returns health status of NimbusPost API credentials (key, secret, warehouse, mode).
 */
export async function GET() {
  try {
    const config = getNimbusPostConfig();
    const token = await getNimbusPostToken(false);
    const isSimulated = token.startsWith("mock_");

    return NextResponse.json(
      {
        success: true,
        configured: config.isConfigured,
        hasKey: config.hasKey,
        hasSecret: config.hasSecret,
        maskedKey: config.maskedKey,
        warehouseName: config.warehouseName,
        pickupPincode: config.pickupPincode,
        mode: isSimulated ? "simulated" : "live",
        message: isSimulated
          ? `High-fidelity test sandbox active with configured API Key (${config.maskedKey})`
          : "Connected directly to live NimbusPost API gateway",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/nimbuspost/auth] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to inspect NimbusPost configuration",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/nimbuspost/auth
 * Generates or retrieves cached NimbusPost authentication token.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const forceRefresh = Boolean(body?.forceRefresh);

    const token = await getNimbusPostToken(forceRefresh);
    const config = getNimbusPostConfig();

    return NextResponse.json(
      {
        success: true,
        token,
        cached: !forceRefresh,
        hasKey: config.hasKey,
        hasSecret: config.hasSecret,
        maskedKey: config.maskedKey,
        isSimulated: token.startsWith("mock_"),
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
