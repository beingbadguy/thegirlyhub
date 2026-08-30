import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";

const MIN_AMOUNT_IN_PAISE = 100;

export async function POST(req: NextRequest) {
  try {
    const decoded = await fetchTokenDetails(req);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "You must log in to create a payment order." },
        { status: 401 },
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

    const { amount, currency = "INR", receipt } = await req.json();
    const amountInPaise = Number(amount);

    if (!Number.isFinite(amountInPaise) || amountInPaise < MIN_AMOUNT_IN_PAISE) {
      return NextResponse.json(
        { success: false, message: "Amount must be at least 100 paise." },
        { status: 400 },
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amountInPaise),
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    });

    return NextResponse.json(
      {
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
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
