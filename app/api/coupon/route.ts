import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Coupon from "@/models/coupon.model";
import { NextRequest, NextResponse } from "next/server";
import { getPagination, paginationResult } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role != "admin") {
      return NextResponse.json(
        {
          message: "You must log in to view your coupons and must be admin.",
          success: false,
        },
        { status: 401 },
      );
    }
    const { page, limit, skip } = getPagination(request);
    const [coupons, total] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Coupon.countDocuments(),
    ]);
    return NextResponse.json(
      {
        coupons,
        success: true,
        message: "Coupons fetched successfully",
        pagination: paginationResult(page, limit, total),
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error fetching coupons", success: false },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  await databaseConnection();
  try {
    const { name, code, discount } = await req.json();

    if (!name || !code || !discount) {
      return NextResponse.json(
        { message: "All fields are required", success: false },
        { status: 400 },
      );
    }
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return NextResponse.json(
        { message: "Coupon already exists", success: false },
        { status: 400 },
      );
    }

    const newCoupon = new Coupon({ name: name.toUpperCase(), code, discount });
    await newCoupon.save();
    return NextResponse.json(
      { newCoupon, success: true, message: "Coupon created successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error creating coupon", success: false },
      { status: 500 },
    );
  }
}
