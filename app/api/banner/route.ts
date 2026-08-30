import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Banner from "@/models/banner.model";
import cloudinary from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

function isFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function parseNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const adminRequested = request.nextUrl.searchParams.get("admin") === "true";
    const isAdmin =
      adminRequested && (await fetchTokenDetails(request))?.role === "admin";
    const banners = await Banner.find(isAdmin ? {} : { isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, banners });
  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch banners" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  await databaseConnection();
  const decoded = await fetchTokenDetails(request);
  if (!decoded || decoded.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const mobileImage = formData.get("mobileImage");
    const tabletImage = formData.get("tabletImage");
    const link = String(formData.get("link") || "").trim();
    const displayOrder = parseNumber(formData.get("displayOrder"));
    const status = formData.get("isActive");
    if (
      !isFile(image) ||
      !link ||
      displayOrder === null ||
      (status !== "true" && status !== "false")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Image, link, display order, and status are required",
        },
        { status: 400 },
      );
    }

    await cloudinaryConnection();
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const upload = await cloudinary.v2.uploader.upload(
      `data:${image.type};base64,${imageBuffer.toString("base64")}`,
      { folder: "basics-banners" },
    );

    let mobileImageUrl = undefined;
    if (mobileImage && isFile(mobileImage)) {
      const mobileImageBuffer = Buffer.from(await mobileImage.arrayBuffer());
      const uploadMobile = await cloudinary.v2.uploader.upload(
        `data:${mobileImage.type};base64,${mobileImageBuffer.toString("base64")}`,
        { folder: "basics-banners" },
      );
      mobileImageUrl = uploadMobile.secure_url;
    }

    let tabletImageUrl = undefined;
    if (tabletImage && isFile(tabletImage)) {
      const tabletImageBuffer = Buffer.from(await tabletImage.arrayBuffer());
      const uploadTablet = await cloudinary.v2.uploader.upload(
        `data:${tabletImage.type};base64,${tabletImageBuffer.toString("base64")}`,
        { folder: "basics-banners" },
      );
      tabletImageUrl = uploadTablet.secure_url;
    }

    const banner = await Banner.create({
      title: String(formData.get("title") || "").trim(),
      subtitle: String(formData.get("subtitle") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      image: upload.secure_url,
      mobileImage: mobileImageUrl,
      tabletImage: tabletImageUrl,
      link,
      buttonText: String(formData.get("buttonText") || "").trim(),
      displayOrder,
      isActive: status === "true",
    });

    return NextResponse.json(
      { success: true, message: "Banner created successfully", banner },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating banner:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create banner" },
      { status: 500 },
    );
  }
}
