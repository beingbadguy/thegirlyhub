import { NextRequest, NextResponse } from "next/server";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import Order from "@/models/order.model";
import { getRecentOrderEvents } from "@/lib/orderEvents";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await databaseConnection();

    // 1. Authenticate Admin
    const decoded = await fetchTokenDetails(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const adminUser = (await User.findById(decoded.userId).select("role").lean()) as any;
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const sinceParam = searchParams.get("since");

    // Calculate start of today (midnight)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Parallel fetch: Recent Orders + Today's Aggregate Stats
    const [recentDbOrders, todayAgg] = await Promise.all([
      Order.find(
        sinceParam
          ? { createdAt: { $gt: new Date(sinceParam) } }
          : { createdAt: { $gte: startOfToday } },
      )
        .sort({ createdAt: -1 })
        .limit(20)
        .select("_id recipientName totalAmount paymentMethod paymentStatus status createdAt products")
        .lean(),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

    const todayStats = {
      todayOrdersCount: todayAgg[0]?.count || 0,
      todayRevenue: todayAgg[0]?.revenue || 0,
    };

    // Format orders for standard realtime payload
    const formattedOrders = recentDbOrders.map((o: any) => ({
      id: o._id.toString(),
      orderId: o._id.toString(),
      totalAmount: o.totalAmount,
      recipientName: o.recipientName || "Customer",
      itemsCount: Array.isArray(o.products) ? o.products.length : 1,
      paymentMethod: o.paymentMethod || "cod",
      paymentStatus: o.paymentStatus || "unpaid",
      status: o.status || "processing",
      createdAt: (o.createdAt || new Date()).toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        orders: formattedOrders,
        todayStats,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Recent Orders] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch recent orders" },
      { status: 500 },
    );
  }
}
