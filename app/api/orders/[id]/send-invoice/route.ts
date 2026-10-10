import { databaseConnection } from "@/config/databseConnection";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { sendCustomerInvoiceEmail } from "@/services/orderMail.service";
import mongoose from "mongoose";

/**
 * POST /api/orders/[id]/send-invoice
 *
 * Sends the official invoice (with attached 1-page PDF and download link)
 * to the customer's email address.
 * Admin only.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { success: false, message: "Order ID is required" },
      { status: 400 }
    );
  }

  try {
    await databaseConnection();

    // Verify admin privileges
    const decoded = await fetchTokenDetails(request);
    const isDev = process.env.NODE_ENV !== "production";
    const origin =
      request.headers.get("origin") || request.headers.get("referer") || "";
    const isLocalOrigin =
      origin.includes("localhost") || origin.includes("127.0.0.1");

    let isAdmin =
      decoded?.role?.toLowerCase() === "admin" ||
      Boolean((decoded as any)?.isAdmin);

    if (!isAdmin && decoded?.userId) {
      const dbUser = (await User.findById(decoded.userId)
        .select("role isAdmin")
        .lean()) as any;
      if (dbUser?.role?.toLowerCase() === "admin" || dbUser?.isAdmin === true) {
        isAdmin = true;
      }
    }

    if (!isAdmin && isDev && isLocalOrigin) {
      isAdmin = true;
    }

    // Read optional override email from request body
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const populateProductOptions = {
      path: "products.productId",
      select: "title name image mainImage price discountedPrice",
    };

    let order: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id)
        .populate("userId", "name email phone")
        .populate(populateProductOptions)
        .lean();
    }

    if (!order) {
      order = await Order.findOne({ orderId: id })
        .populate("userId", "name email phone")
        .populate(populateProductOptions)
        .lean();
    }

    if (!order) {
      order = await Order.findOne({ paymentId: id })
        .populate("userId", "name email phone")
        .populate(populateProductOptions)
        .lean();
    }

    if (!order) {
      return NextResponse.json(
        { success: false, message: `Order #${id} not found.` },
        { status: 404 }
      );
    }

    const orderDoc = order as any;

    // Check authorization: Admin or Order Owner or local origin
    const isOwner = Boolean(
      (decoded?.userId &&
        String(decoded.userId) ===
          String(orderDoc.userId?._id || orderDoc.userId)) ||
        (decoded?.email &&
          decoded.email.toLowerCase() ===
            String(orderDoc.email || "").toLowerCase())
    );

    if (!isAdmin && !isOwner && !isLocalOrigin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: You do not have permission to send this invoice.",
        },
        { status: 403 }
      );
    }

    const isValidEmail = (val?: any): boolean => {
      if (!val || typeof val !== "string") return false;
      const trimmed = val.trim().toLowerCase();
      if (
        !trimmed ||
        trimmed === "no email" ||
        trimmed === "null" ||
        trimmed === "undefined" ||
        trimmed === "guest customer"
      ) {
        return false;
      }
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    };

    let customerEmail: string | undefined = undefined;
    if (isValidEmail(body?.email)) {
      customerEmail = body.email.trim();
    } else if (isValidEmail(orderDoc.email)) {
      customerEmail = orderDoc.email.trim();
    } else if (isValidEmail(orderDoc.userId?.email)) {
      customerEmail = orderDoc.userId.email.trim();
    }

    if (!customerEmail) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No valid email address found for this order. Please enter the recipient email address.",
        },
        { status: 400 }
      );
    }

    // If order record in DB had missing/invalid email, persist this validated email for future communications
    if (!isValidEmail(orderDoc.email) && customerEmail) {
      try {
        await Order.findByIdAndUpdate(orderDoc._id, {
          $set: { email: customerEmail },
        });
      } catch (saveErr) {
        console.warn("Could not backfill email to order:", saveErr);
      }
    }

    const result = await sendCustomerInvoiceEmail({
      to: customerEmail,
      orderId: orderDoc.orderId || String(orderDoc._id),
      recipientName:
        orderDoc.recipientName ||
        orderDoc.customerName ||
        (typeof orderDoc.userId === "object" ? orderDoc.userId?.name : undefined) ||
        "Valued Customer",
      products: (orderDoc.products || []).map((p: any) => ({
        title: p.title || p.productId?.title || "GirlyHub Item",
        size: p.size || "-",
        quantity: Number(p.quantity || 1),
        price: Number(p.price || p.productId?.price || 0),
      })),
      totalAmount: orderDoc.totalAmount,
      subtotal: orderDoc.subtotal,
      discount: (orderDoc.firstOrderDiscount || 0) + (orderDoc.couponDiscount || 0),
      shippingFee: orderDoc.shippingCharge || 0,
      address: orderDoc.address,
      city: orderDoc.city,
      state: orderDoc.state,
      zip: orderDoc.zip || orderDoc.pincode,
      phone: orderDoc.phone || orderDoc.userId?.phone,
      paymentMethod: orderDoc.paymentMethod,
      paymentStatus: orderDoc.paymentStatus,
      createdAt: orderDoc.createdAt,
    });

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        email: result.email,
        orderId: orderDoc.orderId || String(orderDoc._id),
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(`[POST /api/orders/${id}/send-invoice] Error:`, err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Failed to send invoice email",
      },
      { status: 500 }
    );
  }
}
