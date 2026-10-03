import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import Product from "@/models/product.model";
import { OrderStatusMail } from "@/services/sendMail";
import { sendOrderDeliveredEmail } from "@/services/orderMail.service";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

async function verifyIsAdmin(request: NextRequest): Promise<boolean> {
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

  const isDev = process.env.NODE_ENV !== "production";
  const origin = request.headers.get("origin") || request.headers.get("referer") || "";
  const isLocalOrigin = origin.includes("localhost") || origin.includes("127.0.0.1");
  if (!isAdmin && isDev && isLocalOrigin) {
    isAdmin = true;
  }

  return isAdmin;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await databaseConnection();
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { message: "Order ID is required", success: false },
        { status: 400 }
      );
    }

    const isAdmin = await verifyIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized. Admin privileges required.", success: false },
        { status: 401 }
      );
    }

    const populateProductOptions = {
      path: "products.productId",
      select: "title name image mainImage price discountedPrice slug",
    };

    let order: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id)
        .populate("userId", "name email phone role")
        .populate(populateProductOptions)
        .lean();
    }

    if (!order) {
      order = await Order.findOne({ orderId: id })
        .populate("userId", "name email phone role")
        .populate(populateProductOptions)
        .lean();
    }

    if (!order) {
      order = await Order.findOne({ paymentId: id })
        .populate("userId", "name email phone role")
        .populate(populateProductOptions)
        .lean();
    }

    if (!order) {
      return NextResponse.json(
        { message: "Order not found", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, order, data: order, message: "Order fetched successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/orders/:id] Server error fetching order:", error);
    return NextResponse.json(
      { message: "Failed to fetch order", success: false },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await databaseConnection();
  try {
    const { id } = await context.params;

    const isAdmin = await verifyIsAdmin(req);
    if (!isAdmin) {
      return NextResponse.json(
        { message: "Unauthorized. Admin privileges required.", success: false },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { status } = body;

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { message: "A valid status string is required.", success: false },
        { status: 400 }
      );
    }

    let filter: Record<string, any> = { _id: id };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      filter = { orderId: id };
    }

    const order = await Order.findOneAndUpdate(
      filter,
      { $set: { status, ...body } },
      { new: true }
    ).populate("userId");

    if (!order) {
      return NextResponse.json({ message: "Order not found", success: false }, { status: 404 });
    }

    try {
      const customerEmail = order.email || order.userId?.email;
      if (typeof status === "string" && status.toLowerCase() === "delivered") {
        if (customerEmail) {
          await sendOrderDeliveredEmail({
            to: customerEmail,
            recipientName: order.recipientName || order.userId?.name || "Customer",
            orderId: order._id.toString(),
            products: order.products || [],
            totalAmount: order.totalAmount || 0,
          });
        }
      } else if (order.userId?.email) {
        await OrderStatusMail(order.userId.email, order._id, status);
      }
    } catch (mailErr) {
      console.error(`[PUT /api/orders/${id}] Failed to send order status mail:`, mailErr);
    }

    return NextResponse.json(
      { message: "Status updated", order, data: order, success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PUT /api/orders/:id] Server error updating order:", error);
    return NextResponse.json(
      { message: "Failed to update order", success: false },
      { status: 500 }
    );
  }
}
