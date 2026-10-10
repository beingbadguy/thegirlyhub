import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Product from "@/models/product.model";
import Reel from "@/models/reel.model";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await databaseConnection();
    const { id } = await params;
    const reel = await Reel.findById(id).populate("productId").lean();

    if (!reel) {
      return NextResponse.json(
        { success: false, message: "Reel not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, reel });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch reel." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin authorization required." },
        { status: 401 },
      );
    }

    await databaseConnection();
    const { id } = await params;
    const body = await request.json();

    const existingReel = await Reel.findById(id);
    if (!existingReel) {
      return NextResponse.json(
        { success: false, message: "Reel not found." },
        { status: 404 },
      );
    }

    if (body.title !== undefined) existingReel.title = body.title.trim();
    if (body.description !== undefined)
      existingReel.description = body.description.trim();
    if (body.videoUrl !== undefined) existingReel.videoUrl = body.videoUrl.trim();
    if (body.thumbnailUrl !== undefined)
      existingReel.thumbnailUrl = body.thumbnailUrl.trim();
    if (body.duration !== undefined) existingReel.duration = Number(body.duration);
    if (body.displayOrder !== undefined)
      existingReel.displayOrder = Number(body.displayOrder);
    if (body.isActive !== undefined)
      existingReel.isActive = Boolean(body.isActive);

    if (body.productId !== undefined) {
      if (body.productId && typeof body.productId === "string" && body.productId.trim()) {
        const productDoc: any = await Product.findById(body.productId).lean();
        if (productDoc) {
          existingReel.productId = productDoc._id;
          existingReel.productTitle =
            productDoc.title || productDoc.name || "";
          existingReel.productPrice = Number(
            productDoc.discountedPrice ??
              productDoc.sellingPrice ??
              productDoc.price ??
              0,
          );
          existingReel.productImage =
            productDoc.image ||
            productDoc.mainImage ||
            (Array.isArray(productDoc.images) ? productDoc.images[0] : "") ||
            "";
          existingReel.productSlug =
            productDoc.slug || String(productDoc._id);
        }
      } else {
        existingReel.productId = null;
        existingReel.productTitle = "";
        existingReel.productPrice = 0;
        existingReel.productImage = "";
        existingReel.productSlug = "";
      }
    }

    await existingReel.save();

    return NextResponse.json({
      success: true,
      message: "Reel updated successfully.",
      reel: existingReel,
    });
  } catch (error: any) {
    console.error("[Reel Update Error]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update reel." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin authorization required." },
        { status: 401 },
      );
    }

    await databaseConnection();
    const { id } = await params;
    const isHardDelete = request.nextUrl.searchParams.get("hard") === "true";

    if (isHardDelete) {
      await Reel.findByIdAndDelete(id);
      return NextResponse.json({
        success: true,
        message: "Reel permanently deleted.",
      });
    }

    const reel = await Reel.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedBy: decoded.userId || null,
      },
      { new: true },
    );

    if (!reel) {
      return NextResponse.json(
        { success: false, message: "Reel not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reel moved to trash.",
      reel,
    });
  } catch (error: any) {
    console.error("[Reel Delete Error]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete reel." },
      { status: 500 },
    );
  }
}
