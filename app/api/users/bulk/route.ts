import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import Cart from "@/models/cart.model";
import Wishlist from "@/models/wishlist.model";
import mongoose from "mongoose";
import { verifyAdmin } from "@/lib/adminAuth";

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

    const { isAdmin, decoded } = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

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
      const now = new Date();
      const adminId = decoded?.userId && mongoose.Types.ObjectId.isValid(decoded.userId) ? new mongoose.Types.ObjectId(decoded.userId) : null;

      const result = await User.updateMany(
        { _id: { $in: validObjectIds } },
        {
          $set: {
            isDeleted: true,
            deletedAt: now,
            deletedBy: adminId,
            status: "inactive",
            updatedAt: now,
          },
          $push: {
            activityLogs: {
              id: `act_${Date.now()}`,
              action: "Soft Deleted",
              description: "Customer account moved to deleted items via bulk action.",
              timestamp: now,
            },
          },
        },
      );

      return NextResponse.json(
        {
          success: true,
          message: `Successfully moved ${result.modifiedCount || validObjectIds.length} customer accounts to deleted items.`,
        },
        { status: 200 },
      );
    } else if (action === "restore") {
      const now = new Date();
      const result = await User.updateMany(
        { _id: { $in: validObjectIds } },
        {
          $set: {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
            status: "active",
            updatedAt: now,
          },
          $push: {
            activityLogs: {
              id: `act_${Date.now()}`,
              action: "Restored",
              description: "Customer account restored from deleted items via bulk action.",
              timestamp: now,
            },
          },
        },
      );

      return NextResponse.json(
        {
          success: true,
          message: `Successfully restored ${result.modifiedCount || validObjectIds.length} customer accounts.`,
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
