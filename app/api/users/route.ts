import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import "@/models/wishlist.model";
import "@/models/product.model";
import "@/models/category.model";
import "@/models/cart.model";
import "@/models/order.model";
import "@/models/coupon.model";
import "@/models/contact.model";
import "@/models/newsletter.model";
import "@/models/user.model";
import "@/models/promo.model";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { getPagination, paginationResult } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  await databaseConnection();

  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role != "admin") {
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
        .sort({ createdAt: -1 }) // optional: most recent users first
        .skip(skip)
        .limit(limit)
        .populate({
          path: "wishlist",
          populate: {
            path: "products.productId",
            model: "Product",
          },
        })
        .populate({
          path: "cart",
          populate: {
            path: "products.productId",
            model: "Product",
          },
        }),
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
