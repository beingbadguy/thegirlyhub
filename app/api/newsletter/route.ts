import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Newsletter from "@/models/newsletter.model";
import { newsletterSubscriptionMail } from "@/services/sendMail";
import { NextRequest, NextResponse } from "next/server";
import { getPagination, paginationResult } from "@/lib/pagination";
import { checkRateLimitAsync, getClientIp } from "@/lib/rateLimiter";
import { newsletterSchema } from "@/lib/validations/auth.schema";

export async function POST(request: NextRequest) {
  await databaseConnection();
  try {
    // 1. IP Rate Limiting: Max 5 newsletter subscriptions per IP per hour
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(
      `newsletter_${ip}`,
      5,
      60 * 60 * 1000,
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message:
            "Too many subscription attempts from this address. Please try again later.",
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

    // 2. Strict Zod Validation & Sanitization
    const body = await request.json();
    const parseResult = newsletterSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.issues[0]?.message || "Invalid email address";
      return NextResponse.json(
        { message: errorMessage, success: false },
        { status: 400 },
      );
    }

    const { email } = parseResult.data;

    const existingNewsletter = await Newsletter.findOne({ email });
    if (existingNewsletter) {
      return NextResponse.json(
        { message: "This email address is already subscribed.", success: false },
        { status: 409 },
      );
    }

    const newNewsletter = new Newsletter({ email });
    await newNewsletter.save();

    // 3. Dispatch confirmation email in background
    newsletterSubscriptionMail(email).catch((err) => {
      console.error("Error sending newsletterSubscriptionMail:", err);
    });

    return NextResponse.json(
      {
        message: "Subscribed successfully",
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return NextResponse.json(
      { message: "Error subscribing to newsletter", success: false },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        {
          message: "You must be an admin to view newsletter subscribers.",
          success: false,
        },
        { status: 401 },
      );
    }
    const { page, limit, skip } = getPagination(request);
    const [newsletters, total] = await Promise.all([
      Newsletter.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Newsletter.countDocuments(),
    ]);
    return NextResponse.json(
      {
        success: true,
        message: "Newsletters fetched successfully",
        newsletters,
        pagination: paginationResult(page, limit, total),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching newsletters:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get newsletters",
      },
      { status: 500 },
    );
  }
}
