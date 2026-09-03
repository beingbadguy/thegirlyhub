import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { getPagination, paginationResult } from "@/lib/pagination";
import { placeOrderRecord } from "@/lib/placeOrderRecord";
import { prepareCheckout } from "@/lib/prepareCheckout";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  await databaseConnection();

  try {
    const decoded = await fetchTokenDetails(request);
    const body = await request.json();

    if (body.paymentMethod === "online") {
      return NextResponse.json(
        {
          message:
            "Online orders must be paid through Razorpay checkout.",
          success: false,
        },
        { status: 400 },
      );
    }

    const prepared = await prepareCheckout(body, decoded?.userId);
    if (!prepared.ok) {
      return NextResponse.json(
        {
          message: prepared.message,
          errors: prepared.errors,
          success: false,
        },
        { status: prepared.status },
      );
    }

    const newOrder = await placeOrderRecord(prepared.data, {
      paymentStatus: "unpaid",
    });

    return NextResponse.json(
      {
        message: "Order placed successfully",
        success: true,
        order: { _id: newOrder._id.toString() },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error placing order:", error);
    const message =
      error instanceof Error && error.name === "ValidationError"
        ? "Invalid order details. Please check your information and try again."
        : "Unable to place order. Please try again.";
    return NextResponse.json({ message, success: false }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded) {
      return NextResponse.json(
        { message: "You must log in to view your orders", success: false },
        { status: 401 },
      );
    }

    const { page, limit, skip } = getPagination(request);
    const [orders, total] = await Promise.all([
      Order.find({ userId: decoded?.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "userId", select: "-password -pass" })
        .populate({ path: "products.productId" }),
      Order.countDocuments({ userId: decoded?.userId }),
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
    console.log(error);
    return NextResponse.json(
      { message: "Error fetching orders", success: false },
      { status: 500 },
    );
  }
}
