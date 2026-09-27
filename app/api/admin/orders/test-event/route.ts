import { NextRequest, NextResponse } from "next/server";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import { broadcastNewOrder, RealtimeOrderPayload } from "@/lib/orderEvents";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await databaseConnection();

    // Authenticate Admin
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
        { success: false, message: "Forbidden: Admin privileges required" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const mockId = `TEST_${Date.now().toString(36).toUpperCase()}`;

    const testOrder: RealtimeOrderPayload = {
      id: mockId,
      orderId: mockId,
      totalAmount: body.totalAmount || Math.floor(Math.random() * 2500) + 499,
      recipientName: body.recipientName || "Simulated Customer",
      email: "test.customer@girlyhub.in",
      phone: "9876543210",
      city: "Mumbai",
      state: "Maharashtra",
      itemsCount: body.itemsCount || Math.floor(Math.random() * 4) + 1,
      paymentMethod: body.paymentMethod || "online",
      paymentStatus: "paid",
      status: "processing",
      createdAt: new Date().toISOString(),
    };

    broadcastNewOrder(testOrder);

    return NextResponse.json(
      {
        success: true,
        message: "Test order event broadcasted successfully",
        order: testOrder,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[Test Order] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to broadcast test order" },
      { status: 500 },
    );
  }
}
