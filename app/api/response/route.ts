import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { checkRateLimitAsync, getClientIp } from "@/lib/rateLimiter";
import { contactResponseSchema } from "@/lib/validations/auth.schema";
import { replyToUser } from "@/services/sendMail";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce Admin Authorization Guard (Prevent Open Mail Relay)
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        {
          message: "Unauthorized. Admin privileges required.",
          success: false,
        },
        { status: 401 },
      );
    }

    // 2. IP Rate Limiting (Max 30 replies per IP per hour)
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimitAsync(`reply_${ip}`, 30, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message: "Rate limit exceeded. Please wait before sending more replies.",
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

    // 3. Strict Zod Validation & Sanitization
    const body = await request.json();
    const parseResult = contactResponseSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.issues[0]?.message || "Invalid contact response data";
      return NextResponse.json(
        { message: errorMessage, success: false },
        { status: 400 },
      );
    }

    const { email, name, response } = parseResult.data;

    // 4. Dispatch Reply Email
    await replyToUser(email, name, response);

    return NextResponse.json(
      { message: "Response sent successfully", success: true },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending response email:", error);
    return NextResponse.json(
      { message: "Error sending response", success: false },
      { status: 500 },
    );
  }
}
