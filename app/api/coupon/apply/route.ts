import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Coupon from "@/models/coupon.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await databaseConnection();

  try {
    const { code, totalAmount } = await req.json();
    if (!code || !totalAmount) {
      return NextResponse.json(
        { success: false, message: "Coupon code and amount are required" },
        { status: 400 }
      );
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Invalid coupon code" },
        { status: 404 }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { success: false, message: "This coupon is currently inactive" },
        { status: 400 }
      );
    }

    if (coupon.validTill && new Date() > new Date(coupon.validTill)) {
      return NextResponse.json(
        { success: false, message: "This coupon has expired" },
        { status: 400 }
      );
    }

    const decoded = await fetchTokenDetails(req);
    if (decoded && coupon.usersAvailed && coupon.usersAvailed.includes(decoded.userId)) {
      return NextResponse.json(
        { success: false, message: "You have already availed this coupon" },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = Math.round(((totalAmount * coupon.discount) / 100) * 100) / 100;
    } else {
      discountAmount = coupon.discount;
    }
    const finalAmount = Math.max(totalAmount - discountAmount, 0); // prevent negative total

    return NextResponse.json({
      success: true,
      message: "Coupon applied",
      discount: discountAmount,
      finalAmount,
      couponType: coupon.type,
      discountValue: coupon.discount,
      code: coupon.code,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: "Error applying coupon" },
      { status: 500 }
    );
  }
}
