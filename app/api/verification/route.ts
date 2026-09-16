import { NextResponse, NextRequest } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import crypto from "crypto";
import { sendEmailVerificationMail } from "@/services/sendMail";
import { checkRateLimitAsync, getClientIp } from "@/lib/rateLimiter";
import { verificationSchema } from "@/lib/validations/auth.schema";

export async function POST(request: NextRequest) {
  await databaseConnection();
  try {
    // 1. IP Rate Limiting (Max 5 verification email requests per IP per hour)
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(
      `resend_verify_${ip}`,
      5,
      60 * 60 * 1000,
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message:
            "Too many verification requests from this network. Please try again later.",
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

    // 2. Strict Zod Input Validation
    const body = await request.json();
    const parseResult = verificationSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.issues[0]?.message || "Invalid email address";
      return NextResponse.json(
        {
          message: errorMessage,
          success: false,
        },
        { status: 400 },
      );
    }

    const { email } = parseResult.data;

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        {
          message: "User not found with the given email address",
          success: false,
        },
        { status: 404 },
      );
    }

    const verificationToken = crypto.randomInt(100000, 999999).toString();
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendEmailVerificationMail(user.email, verificationToken);
    return NextResponse.json(
      {
        message: "Verification email sent successfully",
        success: true,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error sending verification token:", error);
    return NextResponse.json(
      {
        message: "An error occurred while sending verification token",
        success: false,
      },
      { status: 500 },
    );
  }
}
