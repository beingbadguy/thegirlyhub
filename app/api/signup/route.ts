import User from "@/models/user.model";
import { databaseConnection } from "@/config/databseConnection";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  newUserJoinedNotification,
  sendEmailVerificationMail,
  welcomeUserMail,
} from "@/services/sendMail";
import { checkRateLimitAsync, getClientIp } from "@/lib/rateLimiter";
import { signupSchema } from "@/lib/validations/auth.schema";

export async function POST(request: NextRequest) {
  await databaseConnection();
  try {
    // 1. IP Rate Limiting: Max 5 signups per IP per hour
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(`signup_${ip}`, 5, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many accounts created from this network. Please try again later.",
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
    const parseResult = signupSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.issues[0]?.message || "Invalid registration details";
      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
        },
        { status: 400 },
      );
    }

    const { name, email, password } = parseResult.data;

    // 3. Duplicate Account Check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email address already exists.",
        },
        { status: 409 },
      );
    }

    // 4. Secure Hash Generation (cost factor 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomInt(100000, 999999).toString();
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiry,
      isVerified: false,
    });
    await newUser.save();

    const sanitizedUserData = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role || "user",
      isVerified: false,
      createdAt: newUser.createdAt,
    };

    const response = NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        data: sanitizedUserData,
      },
      {
        status: 201,
      },
    );

    // 5. Dispatch confirmation & welcome emails asynchronously in background
    Promise.allSettled([
      sendEmailVerificationMail(newUser.email, verificationToken),
      welcomeUserMail(newUser.email, newUser.name),
      newUserJoinedNotification(newUser.email, newUser.name),
    ]).catch((err) => {
      console.error("Error sending registration emails:", err);
    });

    return response;
  } catch (error) {
    console.error("Error during signup:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to register user. Please try again.",
      },
      { status: 500 },
    );
  }
}
