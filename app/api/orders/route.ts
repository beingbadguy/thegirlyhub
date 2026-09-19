import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { getPagination, paginationResult } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    let isAdmin = decoded?.role?.toLowerCase() === "admin";

    if (!isAdmin && decoded?.userId) {
      const dbUser = await User.findById(decoded.userId).select("role").lean() as any;
      if (dbUser?.role?.toLowerCase() === "admin") {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      return NextResponse.json(
        {
          message: "You must log in to view orders and must be admin.",
          success: false,
        },
        { status: 401 },
      );
    }

    const { page, limit, skip } = getPagination(request);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const isAll = searchParams.get("all") === "true";
    const filter = status && status !== "all" ? { status } : {};

    const ordersQuery = Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("userId", "name email phone role")
      .populate(
        "products.productId",
        "title name image mainImage price discountedPrice slug",
      )
      .lean();

    if (!isAll) {
      ordersQuery.skip(skip).limit(limit);
    }

    const [orders, total] = await Promise.all([
      ordersQuery,
      Order.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        orders,
        data: orders,
        success: true,
        message: "Orders fetched successfully",
        pagination: paginationResult(isAll ? 1 : page, isAll ? total || 1 : limit, total),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, message: "Error fetching orders", orders: [], data: [] },
      { status: 500 },
    );
  }
}
