import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import crypto from "crypto";
import { forgetPasswordMail } from "@/services/sendMail";
import { checkRateLimitAsync, getClientIp } from "@/lib/rateLimiter";
import { forgotPasswordSchema } from "@/lib/validations/auth.schema";

export async function POST(request: NextRequest) {
  await databaseConnection();
  try {
    // 1. IP Rate Limiting (Max 5 password reset requests per IP per hour)
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(`forget_${ip}`, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many password reset requests from this network. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    // 2. Strict Zod Input Validation
    const body = await request.json();
    const parseResult = forgotPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.issues[0]?.message || "Invalid email address";
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 },
      );
    }

    const { email } = parseResult.data;

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // 3. User-level Rate Limiting: Max 3 requests per 24 hours
    const now = new Date();
    const lastRequest = user.lastResetRequest
      ? new Date(user.lastResetRequest)
      : null;

    if (lastRequest) {
      const diffInHours =
        (now.getTime() - lastRequest.getTime()) / (1000 * 60 * 60);
      if (diffInHours >= 24) {
        user.resetRequestCount = 0;
      }
    }

    if ((user.resetRequestCount || 0) >= 3) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only request password reset 3 times per day.",
        },
        { status: 429 },
      );
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = Date.now() + 60 * 60 * 24 * 1000;
    user.forgetToken = verificationToken;
    user.forgetTokenExpiry = verificationTokenExpiry;
    user.lastResetRequest = now;
    user.resetRequestCount = (user.resetRequestCount || 0) + 1;
    await user.save();

    // 4. Send reset email
    await forgetPasswordMail(user.email, verificationToken);

    return NextResponse.json({
      success: true,
      message: "Reset link sent to your email.",
    });
  } catch (error) {
    console.error("Error in password reset request:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
