import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import HomeReview from "@/models/homeReview.model";
import Product from "@/models/product.model";
import mongoose from "mongoose";

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function requireAdmin(request: NextRequest) {
  const decoded = await fetchTokenDetails(request);
  return decoded && decoded.role === "admin";
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await databaseConnection();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Review ID is required" },
        { status: 400 }
      );
    }

    if (mongoose.Types.ObjectId.isValid(id)) {
      const homeReview = await HomeReview.findById(id).lean();
      if (homeReview) {
        return NextResponse.json({ success: true, review: homeReview });
      }

      const product = await Product.findOne({ "reviews._id": id }).lean();
      if (product && Array.isArray((product as any).reviews)) {
        const review = (product as any).reviews.find(
          (r: any) => r._id?.toString() === id
        );
        if (review) {
          return NextResponse.json({ success: true, review, product });
        }
      }
    }

    return NextResponse.json(
      { success: false, message: "Review not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching review:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch review" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await databaseConnection();
    if (!(await requireAdmin(request))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin role required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Review ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const updateData: Record<string, unknown> = {};

    if (typeof body.username === "string" && body.username.trim()) {
      updateData.username = body.username.trim();
    }
    if (typeof body.comment === "string" && body.comment.trim()) {
      updateData.comment = body.comment.trim();
    }
    if (Number.isFinite(Number(body.rating))) {
      updateData.rating = Math.max(1, Math.min(5, Math.round(Number(body.rating))));
    }
    if (typeof body.productTitle === "string") {
      updateData.productTitle = body.productTitle.trim();
    }
    if (typeof body.productImage === "string") {
      updateData.productImage = body.productImage.trim();
    }
    if (typeof body.isVisible === "boolean") {
      updateData.isVisible = body.isVisible;
    }
    if (typeof body.isVisibleOnHomepage === "boolean") {
      updateData.isVisible = body.isVisibleOnHomepage;
    }

    if (mongoose.Types.ObjectId.isValid(id)) {
      const updated = await HomeReview.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      if (updated) {
        return NextResponse.json({
          success: true,
          review: updated,
          message: "Testimonial updated successfully",
        });
      }
    }

    return NextResponse.json(
      { success: false, message: "Testimonial not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await databaseConnection();
    if (!(await requireAdmin(request))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin role required." },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Review ID is required" },
        { status: 400 }
      );
    }

    // 1. Check and delete from HomeReview
    if (mongoose.Types.ObjectId.isValid(id)) {
      const deletedHomeReview = await HomeReview.findByIdAndDelete(id);
      if (deletedHomeReview) {
        return NextResponse.json({
          success: true,
          message: "Homepage testimonial deleted successfully",
        });
      }
    }

    // 2. Check and delete from Product.reviews (if it's a customer product review)
    const product = await Product.findOne({ "reviews._id": id });
    if (product && Array.isArray(product.reviews)) {
      product.reviews = product.reviews.filter(
        (r: any) => r._id?.toString() !== id
      );
      product.numReviews = product.reviews.length;
      product.totalReviews = product.reviews.length;
      const totalRating = product.reviews.reduce(
        (sum: number, r: any) => sum + (Number(r.rating) || 0),
        0
      );
      product.rating =
        product.reviews.length > 0
          ? Math.round((totalRating / product.reviews.length) * 10) / 10
          : 0;
      product.ratings = product.rating;
      await product.save();

      return NextResponse.json({
        success: true,
        message: "Product review deleted successfully",
      });
    }

    return NextResponse.json(
      { success: false, message: "Review not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete review" },
      { status: 500 }
    );
  }
}
