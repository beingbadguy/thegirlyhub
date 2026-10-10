import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Product from "@/models/product.model";
import Reel from "@/models/reel.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await databaseConnection();

    const searchParams = request.nextUrl.searchParams;
    const adminRequested = searchParams.get("admin") === "true";
    const includeDeleted = searchParams.get("trash") === "true";
    const tokenDetails = await fetchTokenDetails(request);
    const isAdmin = adminRequested && tokenDetails?.role === "admin";

    const filter: Record<string, any> = {};

    if (isAdmin) {
      if (includeDeleted) {
        filter.isDeleted = true;
      } else {
        filter.isDeleted = { $ne: true };
      }
    } else {
      // Public Storefront query
      filter.isActive = { $ne: false };
      filter.isDeleted = { $ne: true };
    }

    const reels = await Reel.find(filter)
      .populate({
        path: "productId",
        select: "title name price discountedPrice sellingPrice image mainImage slug isActive",
      })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        reels: reels || [],
      },
      {
        status: 200,
        headers: isAdmin
          ? {}
          : {
              "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
      },
    );
  } catch (error: any) {
    console.error("[Reels GET Error]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch reels." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin authorization required." },
        { status: 401 },
      );
    }

    await databaseConnection();

    const body = await request.json();
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      aspectRatio = "9:16",
      productId,
      productUrl,
      displayOrder = 0,
      isActive = true,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, message: "Title / Caption is required." },
        { status: 400 },
      );
    }

    if (!videoUrl || !videoUrl.trim()) {
      return NextResponse.json(
        { success: false, message: "Video URL is required." },
        { status: 400 },
      );
    }

    let productMeta: {
      productTitle?: string;
      productPrice?: number;
      productImage?: string;
      productSlug?: string;
    } = {};

    if (productId && typeof productId === "string" && productId.trim()) {
      const productDoc: any = await Product.findById(productId).lean();
      if (productDoc) {
        productMeta = {
          productTitle: productDoc.title || productDoc.name || "",
          productPrice: Number(
            productDoc.discountedPrice ??
              productDoc.sellingPrice ??
              productDoc.price ??
              0,
          ),
          productImage:
            productDoc.image ||
            productDoc.mainImage ||
            (Array.isArray(productDoc.images) ? productDoc.images[0] : "") ||
            "",
          productSlug: productDoc.slug || String(productDoc._id),
        };
      }
    }

    const reel = await Reel.create({
      title: title.trim(),
      description: (description || "").trim(),
      videoUrl: videoUrl.trim(),
      thumbnailUrl: (thumbnailUrl || "").trim(),
      duration: Number(duration || 0),
      aspectRatio: aspectRatio || "9:16",
      productId: productId ? productId : null,
      ...productMeta,
      productUrl: (productUrl || "").trim(),
      displayOrder: Number(displayOrder || 0),
      isActive: Boolean(isActive),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Reel created successfully.",
        reel,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[Reel Create Error]:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create reel." },
      { status: 500 },
    );
  }
}
