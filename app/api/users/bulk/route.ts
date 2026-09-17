import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import Cart from "@/models/cart.model";
import Wishlist from "@/models/wishlist.model";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  await databaseConnection();

  try {
    const body = await request.json();
    const { action, ids, status } = body;

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "Action and an array of customer IDs are required." },
        { status: 400 },
      );
    }

    const validObjectIds = ids
      .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
      .map((id: string) => new mongoose.Types.ObjectId(id));

    if (action === "status") {
      if (!status || !["active", "inactive", "suspended", "pending"].includes(status)) {
        return NextResponse.json(
          { success: false, message: "Valid status value is required." },
          { status: 400 },
        );
      }

      await User.updateMany(
        { _id: { $in: validObjectIds } },
        {
          $set: { status, updatedAt: new Date() },
          $push: {
            activityLogs: {
              id: `act_${Date.now()}`,
              action: "Bulk Status Updated",
              description: `Status changed to ${status} via bulk update.`,
              timestamp: new Date(),
            },
          },
        },
      );

      return NextResponse.json(
        {
          success: true,
          message: `Successfully updated status for ${validObjectIds.length} customers.`,
        },
        { status: 200 },
      );
    } else if (action === "delete") {
      await Cart.deleteMany({ userId: { $in: validObjectIds } });
      await Wishlist.deleteMany({ userId: { $in: validObjectIds } });
      const result = await User.deleteMany({ _id: { $in: validObjectIds } });

      return NextResponse.json(
        {
          success: true,
          message: `Successfully deleted ${result.deletedCount || validObjectIds.length} customer accounts.`,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Unsupported bulk action." },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error performing bulk customer action:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Bulk operation failed." },
      { status: 500 },
    );
  }
}
