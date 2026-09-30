import { NextRequest, NextResponse } from "next/server";
import { checkNimbusPostServiceability } from "@/lib/nimbuspost";

/**
 * POST /api/nimbuspost/serviceability
 * Check courier availability, pricing, and estimated delivery days via NimbusPost.
 *
 * Input:
 * - pickup_postcode: string | number
 * - delivery_postcode: string | number
 * - cod: 0 | 1
 * - weight: number (kg)
 * - order_amount: number (optional)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const defaultPickup = process.env.NIMBUSPOST_PICKUP_PINCODE?.trim() || "110032";
    const pickup_postcode = String(body.pickup_postcode || defaultPickup).trim();
    const delivery_postcode = String(body.delivery_postcode || "").trim();
    const cod = Number(body.cod) === 1 ? 1 : 0;
    const weight = Number(body.weight) > 0 ? Number(body.weight) : 0.2;
    const order_amount = Number(body.order_amount) || 500;

    if (!delivery_postcode || !/^\d{6}$/.test(delivery_postcode)) {
      return NextResponse.json(
        { success: false, message: "delivery_postcode must be a valid 6-digit Indian PIN code" },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(pickup_postcode)) {
      return NextResponse.json(
        { success: false, message: "pickup_postcode must be a valid 6-digit Indian PIN code" },
        { status: 400 }
      );
    }

    const result = await checkNimbusPostServiceability({
      pickup_postcode,
      delivery_postcode,
      cod,
      weight,
      order_amount,
    });

    return NextResponse.json(
      {
        success: result.success,
        couriers: result.couriers,
        cheapest_courier_id: result.cheapest_courier_id,
        fastest_courier_id: result.fastest_courier_id,
        recommended_courier_id: result.recommended_courier_id,
        is_simulated: result.is_simulated,
        message: result.message || "NimbusPost couriers fetched successfully",
      },
      { status: result.success ? 200 : 400 }
    );
  } catch (error: any) {
    console.error("[POST /api/nimbuspost/serviceability] Error:", error);
    return NextResponse.json(
      {
        success: false,
        couriers: [],
        message: error.message || "Failed to check courier serviceability with NimbusPost",
      },
      { status: 500 }
    );
  }
}
