import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { getPagination, paginationResult } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        {
          message: "You must log in to view orders and must be admin.",
          success: false,
        },
        { status: 401 },
      );
    }
    const { page, limit, skip } = getPagination(request);
    const status = request.nextUrl.searchParams.get("status");
    const filter = status && status !== "all" ? { status } : {};

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email phone role")
        .populate(
          "products.productId",
          "title name image mainImage price discountedPrice slug",
        )
        .lean(),
      Order.countDocuments(filter),
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
