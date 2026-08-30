import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Banner from "@/models/banner.model";
import { NextRequest, NextResponse } from "next/server";
import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import cloudinary from "cloudinary";

function isFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

async function requireAdmin(request: NextRequest) {
  const decoded = await fetchTokenDetails(request);
  return decoded?.role === "admin";
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  if (!(await requireAdmin(request))) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 401 },
    );
  }

  try {
    const { id } = await context.params;
    const contentType = request.headers.get("content-type") || "";
    let update: Record<string, unknown>;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      update = {};
      for (const field of [
        "title",
        "subtitle",
        "description",
        "link",
        "buttonText",
      ]) {
        const value = formData.get(field);
        if (typeof value === "string") update[field] = value.trim();
      }
      const displayOrder = Number(formData.get("displayOrder"));
      if (Number.isFinite(displayOrder)) update.displayOrder = displayOrder;
      if (formData.has("isActive"))
        update.isActive = formData.get("isActive") !== "false";

      // File uploads if present
      await cloudinaryConnection();
      
      const imageFile = formData.get("image");
      if (imageFile && isFile(imageFile)) {
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        const upload = await cloudinary.v2.uploader.upload(
          `data:${imageFile.type};base64,${imageBuffer.toString("base64")}`,
          { folder: "basics-banners" },
        );
        update.image = upload.secure_url;
      }

      const mobileImageFile = formData.get("mobileImage");
      if (mobileImageFile && isFile(mobileImageFile)) {
        const imageBuffer = Buffer.from(await mobileImageFile.arrayBuffer());
        const upload = await cloudinary.v2.uploader.upload(
          `data:${mobileImageFile.type};base64,${imageBuffer.toString("base64")}`,
          { folder: "basics-banners" },
        );
        update.mobileImage = upload.secure_url;
      }

      const tabletImageFile = formData.get("tabletImage");
      if (tabletImageFile && isFile(tabletImageFile)) {
        const imageBuffer = Buffer.from(await tabletImageFile.arrayBuffer());
        const upload = await cloudinary.v2.uploader.upload(
          `data:${tabletImageFile.type};base64,${imageBuffer.toString("base64")}`,
          { folder: "basics-banners" },
        );
        update.tabletImage = upload.secure_url;
      }
    } else {
      const body = await request.json();
      update = {
        ...(typeof body.title === "string" ? { title: body.title.trim() } : {}),
        ...(typeof body.subtitle === "string"
          ? { subtitle: body.subtitle.trim() }
          : {}),
        ...(typeof body.description === "string"
          ? { description: body.description.trim() }
          : {}),
        ...(typeof body.image === "string" ? { image: body.image.trim() } : {}),
        ...(typeof body.mobileImage === "string"
          ? { mobileImage: body.mobileImage.trim() }
          : {}),
        ...(typeof body.tabletImage === "string"
          ? { tabletImage: body.tabletImage.trim() }
          : {}),
        ...(typeof body.link === "string" ? { link: body.link.trim() } : {}),
        ...(typeof body.buttonText === "string"
          ? { buttonText: body.buttonText.trim() }
          : {}),
        ...(Number.isFinite(Number(body.displayOrder))
          ? { displayOrder: Number(body.displayOrder) }
          : {}),
        ...(typeof body.isActive === "boolean"
          ? { isActive: body.isActive }
          : {}),
      };
    }

    const banner = await Banner.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (!banner) {
      return NextResponse.json(
        { success: false, message: "Banner not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update banner" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  if (!(await requireAdmin(request))) {
    return NextResponse.json(
      { success: false, message: "Admin access required" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) {
    return NextResponse.json(
      { success: false, message: "Banner not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({
    success: true,
    message: "Banner deleted successfully",
  });
}
