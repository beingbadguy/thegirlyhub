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
      Coupon.find()
        .select("-usersAvailed")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
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
    const decoded = await fetchTokenDetails(req);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        {
          message: "You must log in to create coupons and must be admin.",
          success: false,
        },
        { status: 401 },
      );
    }

    const { name, code, discount, validTill, isActive, type, maxDiscount, minOrderAmount } = await req.json();

    if (!name || !code || discount === undefined || discount === null) {
      return NextResponse.json(
        { message: "Name, code, and discount are required.", success: false },
        { status: 400 },
      );
    }

    const numDiscount = Number(discount);
    if (isNaN(numDiscount) || numDiscount <= 0) {
      return NextResponse.json(
        { message: "Discount must be a number greater than 0.", success: false },
        { status: 400 },
      );
    }

    const couponType = type || "flat";
    if (!["percentage", "flat"].includes(couponType)) {
      return NextResponse.json(
        { message: "Invalid coupon type. Must be 'flat' or 'percentage'.", success: false },
        { status: 400 },
      );
    }

    if (couponType === "percentage" && numDiscount > 100) {
      return NextResponse.json(
        { message: "Percentage discount cannot exceed 100%.", success: false },
        { status: 400 },
      );
    }

    const uppercaseCode = String(code).trim().toUpperCase();
    const existingCoupon = await Coupon.findOne({ code: uppercaseCode });
    if (existingCoupon) {
      return NextResponse.json(
        { message: "Coupon code already exists", success: false },
        { status: 400 },
      );
    }

    const newCoupon = new Coupon({
      name: String(name).trim().toUpperCase(),
      code: uppercaseCode,
      discount: numDiscount,
      maxDiscount: maxDiscount !== undefined && maxDiscount !== null && Number(maxDiscount) > 0 ? Number(maxDiscount) : null,
      minOrderAmount: minOrderAmount !== undefined && minOrderAmount !== null && Number(minOrderAmount) > 0 ? Number(minOrderAmount) : 0,
      validTill: validTill ? new Date(validTill) : null,
      isActive: isActive !== undefined ? isActive : true,
      type: couponType,
    });

    await newCoupon.save();
    return NextResponse.json(
      { coupon: newCoupon, success: true, message: "Coupon created successfully" },
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
