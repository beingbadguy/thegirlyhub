import { NextResponse, NextRequest } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import { userVerifiedMail } from "@/services/sendMail";
import { generateTokenAndSetCookie } from "@/lib/generateTokenAndSetCookie";
import {
  checkRateLimitAsync,
  getClientIp,
  getUserAgent,
  isIpBlockedAsync,
  recordFailedAttemptAsync,
} from "@/lib/rateLimiter";
import { verifyCodeSchema } from "@/lib/validations/auth.schema";

export async function POST(request: NextRequest) {
  await databaseConnection();
  try {
    const ip = getClientIp(request);
    const userAgent = getUserAgent(request);

    // 1. Abuse Check: Block repeated brute-force offenders
    const blockStatus = await isIpBlockedAsync(ip);
    if (blockStatus.blocked) {
      return NextResponse.json(
        {
          message:
            "Too many failed verification attempts. Your access is temporarily restricted.",
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

    // 2. IP Rate Limiting: Max 10 verification attempts per 15 minutes
    const rateLimit = await checkRateLimitAsync(
      `verify_code_${ip}`,
      10,
      15 * 60 * 1000,
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message:
            "Too many attempts. Please wait a few minutes before trying again.",
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

    // 3. Strict Zod Validation
    const body = await request.json();
    const parseResult = verifyCodeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          message: "Please provide a valid verification code.",
          success: false,
        },
        { status: 400 },
      );
    }

    const { token } = parseResult.data;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      await recordFailedAttemptAsync(
        ip,
        userAgent,
        "Failed account verification code attempt",
      );
      return NextResponse.json(
        {
          message: "Invalid or expired verification code.",
          success: false,
        },
        { status: 400 },
      );
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    // Send confirmation mail asynchronously
    userVerifiedMail(user.email).catch((err) => {
      console.error("Error sending userVerifiedMail:", err);
    });

    const response = NextResponse.json(
      {
        message: "User verified successfully",
        success: true,
      },
      { status: 200 },
    );

    generateTokenAndSetCookie(user._id, user.isVerified, user.role, response);

    return response;
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      {
        message: "An error occurred while verifying. Please try again.",
        success: false,
      },
      { status: 500 },
    );
  }
}
