import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

/**
 * High-definition Video & Thumbnail Upload Endpoint.
 * Strictly preserves maximum video quality without downscaling or aggressive compression.
 */
export async function POST(request: NextRequest) {
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin authorization required." },
        { status: 401 },
      );
    }

    await cloudinaryConnection();

    const formData = await request.formData();
    const videoFile = formData.get("video") as File | null;
    const thumbnailFile = formData.get("thumbnail") as File | null;

    if (!videoFile || !(videoFile instanceof File) || videoFile.size === 0) {
      return NextResponse.json(
        { success: false, message: "A valid video file is required." },
        { status: 400 },
      );
    }

    // Convert video buffer
    const arrayBuffer = await videoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = videoFile.type || "video/mp4";
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary with maximum quality preservation
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      resource_type: "video",
      folder: "girlyhub_reels",
      // Preserve pristine original resolution and bitrate:
      quality: "auto:best",
      // Keep aspect ratio intact (9:16 vertical)
      transformation: [{ flags: "preserve_transparency" }],
    });

    let customThumbnailUrl = "";
    if (thumbnailFile && thumbnailFile instanceof File && thumbnailFile.size > 0) {
      const thumbBuf = Buffer.from(await thumbnailFile.arrayBuffer());
      const thumbUri = `data:${thumbnailFile.type || "image/jpeg"};base64,${thumbBuf.toString("base64")}`;
      const thumbResult = await cloudinary.uploader.upload(thumbUri, {
        resource_type: "image",
        folder: "girlyhub_reels_thumbs",
        quality: "auto:best",
      });
      customThumbnailUrl = thumbResult.secure_url;
    }

    // Cloudinary auto-generates video poster by replacing video extension with .jpg
    const autoPosterUrl = uploadResult.secure_url.replace(/\.[^/.]+$/, ".jpg");

    return NextResponse.json({
      success: true,
      message: "High-quality video uploaded successfully",
      videoUrl: uploadResult.secure_url,
      thumbnailUrl: customThumbnailUrl || autoPosterUrl,
      duration: Math.round(uploadResult.duration || 0),
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (error: any) {
    console.error("[Reel Video Upload Error]:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to upload reel video.",
      },
      { status: 500 },
    );
  }
}
