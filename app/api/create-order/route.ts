import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { prepareCheckout } from "@/lib/prepareCheckout";
import PendingPayment from "@/models/pendingPayment.model";
import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await databaseConnection();

  try {
    const decoded = await fetchTokenDetails(req);
    const body = await req.json();

    const prepared = await prepareCheckout(
      {
        ...body,
        paymentMethod: "online",
      },
      decoded?.userId,
    );

    if (!prepared.ok) {
      return NextResponse.json(
        { success: false, message: prepared.message, errors: prepared.errors },
        { status: prepared.status },
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { success: false, message: "Razorpay is not configured." },
        { status: 500 },
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const amountInPaise = prepared.data.expectedAmountInPaise;
    if (amountInPaise < 100) {
      return NextResponse.json(
        { success: false, message: "Amount must be at least ₹1." },
        { status: 400 },
      );
    }

    const pending = await PendingPayment.create({
      razorpayOrderId: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      amountInPaise,
      userId: prepared.data.userId,
      isGuest: prepared.data.isGuest,
      orderPayload: body,
      status: "pending",
    });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `gh_${pending._id.toString().slice(-12)}`,
      notes: {
        pendingId: pending._id.toString(),
        guest: prepared.data.isGuest ? "1" : "0",
      },
    });

    pending.razorpayOrderId = order.id;
    pending.updatedAt = new Date();
    await pending.save();

    return NextResponse.json(
      {
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        pendingId: pending._id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create Razorpay order." },
      { status: 500 },
    );
  }
}
