import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import bcrypt from "bcrypt";
import { passwordResetSuccessMail } from "@/services/sendMail";
import { checkRateLimitAsync, getClientIp } from "@/lib/rateLimiter";
import { resetPasswordSchema } from "@/lib/validations/auth.schema";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  await databaseConnection();
  try {
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(`reset_pw_${ip}`, 10, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message:
            "Too many password reset attempts from this network. Please try again later.",
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

    const { token } = await context.params;
    const body = await request.json().catch(() => ({}));

    const parseResult = resetPasswordSchema.safeParse({
      token,
      password: body.password,
    });

    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.issues[0]?.message || "Invalid token or password";
      return NextResponse.json(
        { message: errorMessage, success: false },
        { status: 400 },
      );
    }

    const { password } = parseResult.data;

    const user = await User.findOne({
      forgetToken: token,
      forgetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        {
          message:
            "Invalid or expired reset link. Please request a new password reset.",
          success: false,
        },
        { status: 400 },
      );
    }

    user.password = await bcrypt.hash(password, 10);
    user.forgetToken = null;
    user.forgetTokenExpiry = null;
    await user.save();

    passwordResetSuccessMail(user.email).catch((err) => {
      console.error("Error sending passwordResetSuccessMail:", err);
    });

    return NextResponse.json(
      { message: "Password reset successful", success: true },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in reset password token route:", error);
    return NextResponse.json(
      {
        message: "An error occurred while processing your request.",
        success: false,
      },
      { status: 500 },
    );
  }
}
