import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import Wishlist from "@/models/wishlist.model";
import Cart from "@/models/cart.model";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { getPagination, paginationResult } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  await databaseConnection();

  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        {
          message: "Unauthorised Access, you must be admin",
          success: false,
        },
        { status: 401 },
      );
    }
    const { page, limit, skip } = getPagination(request);
    const [users, total] = await Promise.all([
      User.find({})
        .select("-password -pass -verificationToken -verificationTokenExpiry -forgetToken -forgetTokenExpiry")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "wishlist",
          select: "products",
          populate: {
            path: "products.productId",
            model: "Product",
            select: "title image images price discountedPrice category stock countInStock",
          },
        })
        .populate({
          path: "cart",
          select: "products",
          populate: {
            path: "products.productId",
            model: "Product",
            select: "title image images price discountedPrice category stock countInStock",
          },
        })
        .populate({
          path: "order",
          select: "totalAmount status createdAt recipientName paymentMethod",
        })
        .lean(),
      User.countDocuments(),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Users fetched successfully",
        users,
        pagination: paginationResult(page, limit, total),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching users:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch users",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
