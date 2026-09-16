import { NextRequest, NextResponse } from "next/server";
import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { v2 as cloudinary } from "cloudinary";

/**
 * Direct Client-to-Cloudinary Signed Upload Endpoint.
 * Generates an HMAC-SHA1/SHA256 signature allowing the client browser to upload
 * directly to Cloudinary CDN, bypassing Next.js server RAM/event-loop buffering.
 */
export async function POST(request: NextRequest) {
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin role required." },
        { status: 401 },
      );
    }

    await cloudinaryConnection();

    const body = await request.json().catch(() => ({}));
    const folder = String(body.folder || "girlyhub_uploads").trim();
    const timestamp = Math.round(new Date().getTime() / 1000);

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    if (!apiSecret || !apiKey || !cloudName) {
      return NextResponse.json(
        { success: false, message: "Cloudinary credentials missing in environment." },
        { status: 500 },
      );
    }

    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    });
  } catch (error) {
    console.error("[Upload Signature Error]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate upload signature." },
      { status: 500 },
    );
  }
}
