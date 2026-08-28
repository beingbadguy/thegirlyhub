import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Coupon from "@/models/coupon.model";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized. Admin role required.", success: false },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return NextResponse.json(
        { message: "Coupon not found", success: false },
        { status: 404 },
      );
    }

    if (body.name !== undefined) coupon.name = body.name.toUpperCase();
    if (body.code !== undefined) {
      const uppercaseCode = body.code.toUpperCase();
      const existing = await Coupon.findOne({ code: uppercaseCode, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json(
          { message: "Coupon code already exists", success: false },
          { status: 400 },
        );
      }
      coupon.code = uppercaseCode;
    }
    if (body.discount !== undefined) coupon.discount = body.discount;
    if (body.isActive !== undefined) coupon.isActive = body.isActive;
    if (body.type !== undefined) {
      if (!["percentage", "flat"].includes(body.type)) {
        return NextResponse.json(
          { message: "Invalid coupon type. Must be 'flat' or 'percentage'.", success: false },
          { status: 400 },
        );
      }
      coupon.type = body.type;
    }
    if (body.validTill !== undefined) {
      coupon.validTill = body.validTill ? new Date(body.validTill) : (null as unknown as Date);
    }

    await coupon.save();

    return NextResponse.json(
      { coupon, success: true, message: "Coupon updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { message: "Error updating coupon", success: false },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized. Admin role required.", success: false },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const deletedCoupon = await Coupon.findByIdAndDelete(id);
    if (!deletedCoupon) {
      return NextResponse.json(
        { message: "Coupon not found", success: false },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Coupon deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { message: "Error deleting coupon", success: false },
      { status: 500 },
    );
  }
}
