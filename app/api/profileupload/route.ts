import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import cloudinary from "cloudinary";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { checkRateLimitAsync } from "@/lib/rateLimiter";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function PUT(request: NextRequest) {
  await databaseConnection();
  cloudinaryConnection();
  try {
    // 1. Strict Authentication Guard
    const decoded = await fetchTokenDetails(request);
    if (!decoded?.userId) {
      return NextResponse.json(
        { message: "Unauthorized. Please log in.", success: false },
        { status: 401 },
      );
    }

    // 2. Rate Limiting: Max 10 profile picture uploads per hour per user
    const rateLimit = await checkRateLimitAsync(
      `profile_upload_${decoded.userId}`,
      10,
      60 * 60 * 1000,
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message:
            "Too many profile upload attempts. Please try again later.",
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

    const formData = await request.formData();
    const image = formData.get("image") as File | null;

    if (!image || typeof image === "string") {
      return NextResponse.json(
        { message: "Profile image is required", success: false },
        { status: 400 },
      );
    }

    // 3. Validate MIME type and file size
    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
      return NextResponse.json(
        {
          message:
            "Invalid file format. Allowed formats: JPG, PNG, WEBP, GIF, AVIF.",
          success: false,
        },
        { status: 400 },
      );
    }

    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          message: "Profile image size cannot exceed 5MB.",
          success: false,
        },
        { status: 400 },
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found", success: false },
        { status: 404 },
      );
    }

    // Convert and upload securely
    const arrayBuffer = await image.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");
    const dataURI = `data:${image.type};base64,${base64String}`;

    const profilePicture = await cloudinary.v2.uploader.upload(dataURI, {
      folder: "profilePicture",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
      ],
    });

    user.image = profilePicture.secure_url;
    await user.save();

    // 4. Return sanitized user payload (prevent password/token leaks)
    const sanitizedUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      image: user.image,
      isVerified: Boolean(user.isVerified),
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      landmark: user.landmark || "",
      zip: user.zip || null,
      phone: user.phone || null,
    };

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        success: true,
        user: sanitizedUser,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error changing profile image:", error);
    return NextResponse.json(
      { message: "Error changing profile picture", success: false },
      { status: 500 },
    );
  }
}
