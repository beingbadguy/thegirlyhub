import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import bcrypt from "bcrypt";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { checkRateLimitAsync, getClientIp } from "@/lib/rateLimiter";
import { changePasswordSchema } from "@/lib/validations/auth.schema";

export async function POST(request: NextRequest) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in." },
        { status: 401 },
      );
    }

    // Rate limit: max 5 password change attempts per 15 minutes per user
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(
      `change_pw_${decoded.userId}_${ip}`,
      5,
      15 * 60 * 1000,
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many password change attempts. Please wait before trying again.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = changePasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: parseResult.error.issues[0]?.message || "Invalid password data.",
        },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = parseResult.data;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    // If user signed up via Google or Apple without password
    if (!user.password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your account was created via social login (Google/Apple). Password cannot be changed here.",
        },
        { status: 400 },
      );
    }

    // Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Current password does not match our records." },
        { status: 400 },
      );
    }

    // Prevent re-using identical password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        {
          success: false,
          message: "New password cannot be the same as your current password.",
        },
        { status: 400 },
      );
    }

    // Hash and store
    user.password = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Your password has been successfully updated.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in change-password:", error);
    return NextResponse.json(
      { success: false, message: "Unable to update password. Please try again later." },
      { status: 500 },
    );
  }
}
