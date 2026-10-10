import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import { verifyAdmin } from "@/lib/adminAuth";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await databaseConnection();
  try {
    const { id } = await context.params;
    const { isAdmin } = await verifyAdmin(req);
    if (!isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized. Admin privileges required.", success: false },
        { status: 401 }
      );
    }

    let filter: Record<string, any> = { _id: id };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      filter = { orderId: id };
    }

    const order = await Order.findOneAndUpdate(
      filter,
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
        },
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { message: "Order not found", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Order restored successfully",
      success: true,
      order,
      data: order,
    });
  } catch (error) {
    console.error("[POST /api/order/:id/restore] Server error restoring order:", error);
    return NextResponse.json(
      { message: "Failed to restore order", success: false },
      { status: 500 }
    );
  }
}
