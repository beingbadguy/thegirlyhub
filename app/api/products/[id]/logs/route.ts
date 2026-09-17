import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import ProductLog from "@/models/productLog.model";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await databaseConnection();
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    const query: any = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query.$or = [{ productId: id }, { productSlug: id }];
    } else {
      query.productSlug = id;
    }

    const logs = await ProductLog.find(query)
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch product logs" },
      { status: 500 }
    );
  }
}
