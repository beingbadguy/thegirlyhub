import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { getPagination, paginationResult } from "@/lib/pagination";

import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    let isAdmin =
      decoded?.role?.toLowerCase() === "admin" ||
      Boolean((decoded as any)?.isAdmin);

    if (!isAdmin && decoded?.userId) {
      const dbUser = (await User.findById(decoded.userId).select("role isAdmin").lean()) as any;
      if (dbUser?.role?.toLowerCase() === "admin" || dbUser?.isAdmin === true) {
        isAdmin = true;
      }
    }

    // In local development, allow localhost admin requests if token missing
    const isDev = process.env.NODE_ENV !== "production";
    const origin = request.headers.get("origin") || request.headers.get("referer") || "";
    const isLocalOrigin = origin.includes("localhost") || origin.includes("127.0.0.1");

    if (!isAdmin && isDev && isLocalOrigin) {
      isAdmin = true;
    }

    if (!isAdmin) {
      return NextResponse.json(
        {
          message: "You must log in to view orders and must be admin.",
          success: false,
          orders: [],
          data: [],
        },
        { status: 401 },
      );
    }

    const { page, limit, skip } = getPagination(request);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status")?.trim().toLowerCase();
    const search = searchParams.get("search")?.trim();
    const isAll = searchParams.get("all") === "true" || !searchParams.has("page");
    const isDeletedQuery = searchParams.get("deleted") === "true";

    const filter: Record<string, any> = {};
    if (isDeletedQuery) {
      filter.isDeleted = true;
    } else {
      filter.isDeleted = { $ne: true };
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      const orConditions: any[] = [
        { recipientName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "products.title": { $regex: search, $options: "i" } },
        { awbNumber: { $regex: search, $options: "i" } },
        { orderId: search },
      ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(search) });
      }
      filter.$or = orConditions;
    }

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
    } else {
      ordersQuery.limit(500);
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
