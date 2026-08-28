import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";
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
          message: "You must log in to view your contacts and must be admin.",
          success: false,
        },
        { status: 401 },
      );
    }
    const { page, limit, skip } = getPagination(request);
    const [orders, total] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "-password")
        .populate("products.productId"),
      Order.countDocuments(),
    ]);

    return NextResponse.json(
      {
        orders,
        success: true,
        message: "Orders fetched successfully",
        pagination: paginationResult(page, limit, total),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching orders" },
      { status: 500 },
    );
  }
}
