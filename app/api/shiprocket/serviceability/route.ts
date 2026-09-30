import { NextRequest, NextResponse } from "next/server";
import { checkServiceability } from "@/lib/shiprocket";

/**
 * POST /api/shiprocket/serviceability
 * Check courier availability, pricing, and estimated delivery days.
 *
 * Input JSON:
 * - pickup_postcode: string | number (optional, defaults to store warehouse)
 * - delivery_postcode: string | number (required, 6 digits)
 * - cod: 0 | 1 (optional, default 0)
 * - weight: number (optional in kg, default 0.2)
 *
 * Output:
 * - List of couriers: courier_id, courier_name, rate, estimated_days, is_cheapest, is_fastest
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    const defaultPickup = process.env.SHIPROCKET_PICKUP_PINCODE?.trim() || "110001";
    const pickup_postcode = String(body.pickup_postcode || defaultPickup).trim();
    const delivery_postcode = String(body.delivery_postcode || "").trim();
    const cod = Number(body.cod) === 1 ? 1 : 0;
    const weight = Number(body.weight) > 0 ? Number(body.weight) : 0.2;

    // Validate delivery pincode
    if (!delivery_postcode) {
      return NextResponse.json(
        {
          success: false,
          message: "delivery_postcode is required",
        },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(delivery_postcode)) {
      return NextResponse.json(
        {
          success: false,
          message: "delivery_postcode must be a valid 6-digit Indian PIN code",
        },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(pickup_postcode)) {
      return NextResponse.json(
        {
          success: false,
          message: "pickup_postcode must be a valid 6-digit Indian PIN code",
        },
        { status: 400 }
      );
    }

    const result = await checkServiceability({
      pickup_postcode,
      delivery_postcode,
      cod,
      weight,
    });

    return NextResponse.json(
      {
        success: result.success,
        couriers: result.couriers,
        cheapest_courier_id: result.cheapest_courier_id,
        fastest_courier_id: result.fastest_courier_id,
        recommended_courier_id: result.recommended_courier_id,
        is_simulated: result.is_simulated,
        message: result.message || "Couriers fetched successfully",
      },
      { status: result.success ? 200 : 400 }
    );
  } catch (error: any) {
    console.error("[POST /api/shiprocket/serviceability] Error:", error);
    return NextResponse.json(
      {
        success: false,
        couriers: [],
        message: error.message || "Failed to check courier serviceability",
      },
      { status: 500 }
    );
  }
}
