import bcrypt from "bcrypt";
import User from "@/models/user.model";
import { databaseConnection } from "@/config/databseConnection";
import { NextRequest, NextResponse } from "next/server";
import { generateTokenAndSetCookie } from "@/lib/generateTokenAndSetCookie";
import crypto from "crypto";
import { sendEmailVerificationMail } from "@/services/sendMail";
import { loginSchema } from "@/lib/validations/auth.schema";
import {
  checkRateLimitAsync,
  clearRateLimit,
  getClientIp,
  getUserAgent,
  isIpBlockedAsync,
  recordFailedAttemptAsync,
} from "@/lib/rateLimiter";

export async function POST(request: NextRequest) {
  await databaseConnection();
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  // 1. Abuse Check: Block if IP is temporarily banned
  const blockStatus = await isIpBlockedAsync(ip);
  if (blockStatus.blocked) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many failed login attempts. Please try again later.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(blockStatus.retryAfterSeconds) },
      },
    );
  }

  // 2. Rate Limiting: Max 10 login attempts per IP per 15 mins
  const rateLimit = await checkRateLimitAsync(`login_${ip}`, 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: "Too many login attempts. Please wait before trying again.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.issues[0]?.message || "Invalid credentials format",
        },
        { status: 400 },
      );
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.trim().toLowerCase();
    const user = (await User.findOne({ email: normalizedEmail })
      .select("_id name email password role isVerified")
      .lean()) as any;

    // Constant-time dummy hash to mitigate user enumeration timing attacks
    const DUMMY_HASH = "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ123456";
    const passwordToCompare = user?.password || DUMMY_HASH;

    const isMatched = await bcrypt.compare(password, passwordToCompare);
    if (!user || !isMatched) {
      // Record failed attempt for brute-force tracking
      await recordFailedAttemptAsync(ip, userAgent, `Failed login for ${email}`, 5, 15 * 60 * 1000);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password",
        },
        { status: 401 },
      );
    }

    // Clear failed attempts on successful credentials match
    clearRateLimit(`login_${ip}`).catch(() => {});

    if (!user.isVerified) {
      const verificationToken = crypto.randomInt(100000, 999999).toString();
      const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Update DB asynchronously
      User.updateOne(
        { _id: user._id },
        { $set: { verificationToken, verificationTokenExpiry } },
      ).catch(() => {});

      // Fire-and-forget email dispatch
      sendEmailVerificationMail(user.email, verificationToken).catch((err) => {
        console.error("Error sending verification mail on login:", err);
      });

      return NextResponse.json(
        {
          success: false,
          needsVerification: true,
          email: user.email,
          message:
            "Please verify your email before signing in. A new code was sent.",
        },
        { status: 403 },
      );
    }

    const authUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully",
      data: authUser,
    });

    generateTokenAndSetCookie(user._id, user.isVerified, user.role, response);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to log in user",
      },
      { status: 500 },
    );
  }
}
