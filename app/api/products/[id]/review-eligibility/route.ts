import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import mongoose from "mongoose";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: true, eligible: false, message: "Please log in to review." },
        { status: 200 }
      );
    }

    const { id } = await params;
    
    // Find the product first to get the database _id (in case 'id' is a slug)
    const product = mongoose.Types.ObjectId.isValid(id)
      ? await Product.findById(id)
      : await Product.findOne({ slug: id });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Check if user has ordered and received the item (order status 'delivered' or 'completed')
    const hasOrder = await Order.findOne({
      userId: decoded.userId,
      status: { $in: ["delivered", "completed"] },
      "products.productId": product._id,
    });

    return NextResponse.json(
      {
        success: true,
        eligible: !!hasOrder,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error checking review eligibility:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
