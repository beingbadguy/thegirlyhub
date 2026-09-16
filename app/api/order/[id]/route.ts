import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Order from "@/models/order.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

function maskEmail(email?: string | null): string {
  if (!email || !email.includes("@")) return "******";
  const [local, domain] = email.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}****@${domain}`;
}

function maskPhone(phone?: number | string | null): string {
  if (!phone) return "******";
  const str = String(phone).replace(/\D/g, "");
  if (str.length < 4) return "******";
  return "******" + str.slice(-4);
}

function maskName(name?: string | null): string {
  if (!name || !name.trim()) return "Customer";
  const parts = name.trim().split(/\s+/);
  return parts.map((p) => (p.length > 1 ? p[0] + "***" : p)).join(" ");
}

function maskAddress(address?: string | null): string {
  if (!address) return "Protected Address";
  return "****** (Address hidden for privacy)";
}

export async function GET(
  request: NextRequest,
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

    let order: any = null;
    const populateProductOptions = {
      path: "products.productId",
      select: "title name image mainImage price discountedPrice slug",
    };

    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).populate(populateProductOptions).lean();
    }

    if (!order) {
      order = await Order.findOne({ paymentId: id }).populate(populateProductOptions).lean();
    }

    if (!order) {
      console.warn(`[GET /api/order/${id}] Order not found`);
      return NextResponse.json(
        { message: "Order not found", success: false },
        { status: 404 }
      );
    }

    // Access control evaluation
    const decoded = await fetchTokenDetails(request);
    const emailParam = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
    const phoneParam = request.nextUrl.searchParams.get("phone")?.trim();

    const isAdmin = decoded?.role === "admin";
    const isOwner = Boolean(
      decoded?.userId &&
      order.userId &&
      order.userId.toString() === decoded.userId
    );
    const isGuestVerified = Boolean(
      (emailParam && order.email && order.email.toLowerCase() === emailParam) ||
      (phoneParam && order.phone && String(order.phone) === phoneParam)
    );

    const isAuthorizedFullAccess = isAdmin || isOwner || isGuestVerified;

    const orderObj = typeof order.toObject === "function" ? order.toObject() : { ...order };

    if (!isAuthorizedFullAccess) {
      // If a logged-in user is explicitly attempting to view another user's order
      if (decoded?.userId && order.userId && order.userId.toString() !== decoded.userId) {
        console.warn(
          `[GET /api/order/${id}] Security alert: Cross-account order access blocked`,
          {
            requesterUserId: decoded.userId,
            orderUserId: order.userId.toString(),
            orderId: id,
            ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
            timestamp: new Date().toISOString(),
          }
        );
        return NextResponse.json(
          { message: "You do not have permission to view this order.", success: false },
          { status: 403 }
        );
      }

      // Public / unverified guest tracking request -> return sanitized order with masked PII
      orderObj.recipientName = maskName(orderObj.recipientName);
      orderObj.phone = maskPhone(orderObj.phone);
      orderObj.email = maskEmail(orderObj.email);
      orderObj.address = maskAddress(orderObj.address);
      orderObj.landmark = null;
      orderObj.orderNotes = null;
      orderObj.isMasked = true;

      console.log(`[GET /api/order/${id}] Masked order data returned for unverified tracking request`, {
        orderId: id,
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        timestamp: new Date().toISOString(),
      });
    } else {
      console.log(`[GET /api/order/${id}] Full order data retrieved by authorized user`, {
        orderId: id,
        accessType: isAdmin ? "admin" : isOwner ? "owner" : "guest_verified",
        user: decoded?.userId || emailParam || "verified",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { order: orderObj, success: true, message: "Order fetched successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/order/:id] Server error fetching order:", error);
    return NextResponse.json(
      { message: "Error fetching order", success: false },
      { status: 500 }
    );
  }
}


