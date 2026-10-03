import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await databaseConnection();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required" },
        { status: 400 }
      );
    }

    const populateOptions = {
      path: "products.productId",
      select: "title name image mainImage price discountedPrice slug category",
    };

    let order: any = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id)
        .populate("userId", "name email phone")
        .populate(populateOptions)
        .lean();
    }

    if (!order) {
      order = await Order.findOne({ orderId: id })
        .populate("userId", "name email phone")
        .populate(populateOptions)
        .lean();
    }

    if (!order) {
      order = await Order.findOne({ paymentId: id })
        .populate("userId", "name email phone")
        .populate(populateOptions)
        .lean();
    }

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
      message: "Invoice order retrieved successfully",
    });
  } catch (error: any) {
    console.error("[GET /api/invoice/:id] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load invoice" },
      { status: 500 }
    );
  }
}
