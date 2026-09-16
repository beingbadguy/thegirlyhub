import { databaseConnection } from "@/config/databseConnection";
import { verifyRecaptcha } from "@/lib/captcha";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { getPagination, paginationResult } from "@/lib/pagination";
import { placeOrderRecord } from "@/lib/placeOrderRecord";
import { prepareCheckout } from "@/lib/prepareCheckout";
import {
  checkRateLimit,
  getClientIp,
  getUserAgent,
  isIpBlocked,
  recordFailedAttempt,
} from "@/lib/rateLimiter";
import Order from "@/models/order.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  await databaseConnection();

  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  // 1. Abuse Protection: Check if IP is temporarily blocked
  const blockStatus = isIpBlocked(ip);
  if (blockStatus.blocked) {
    console.warn(
      `[POST /api/order] Blocked abuse request from IP ${ip} | User-Agent: ${userAgent}`,
    );
    return NextResponse.json(
      {
        message:
          "Your access has been temporarily restricted due to repeated failed attempts. Please try again later.",
        success: false,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(blockStatus.retryAfterSeconds),
        },
      },
    );
  }

  // 2. Rate Limiting: Max 3 orders per IP per hour
  const rateLimit = checkRateLimit(`order_${ip}`, 3, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    console.warn(
      `[POST /api/order] Rate limit exceeded for IP ${ip} | User-Agent: ${userAgent}`,
    );
    return NextResponse.json(
      {
        message:
          "Too many orders placed from this address. Please try again in an hour.",
        success: false,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

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

    // 3. CAPTCHA Verification: Reject invalid/missing tokens for COD
    const captchaResult = await verifyRecaptcha(body.captchaToken, ip);
    if (!captchaResult.success) {
      recordFailedAttempt(
        ip,
        userAgent,
        `Captcha verification failed: ${captchaResult.reason}`,
      );
      return NextResponse.json(
        {
          message:
            "Security check failed. Please complete the CAPTCHA verification and try again.",
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
  } catch (error: any) {
    console.error("Error placing order:", error);
    if (error?.code === "OUT_OF_STOCK" || error?.message?.includes("out of stock")) {
      return NextResponse.json(
        { message: error.message || "Out of stock", success: false },
        { status: 400 },
      );
    }
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
      Order.find({ userId: decoded.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "userId", select: "name email phone" })
        .populate({
          path: "products.productId",
          select: "title name image mainImage price discountedPrice slug",
        })
        .lean(),
      Order.countDocuments({ userId: decoded.userId }),
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
