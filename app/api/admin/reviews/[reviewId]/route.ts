import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import HomeReview from "@/models/homeReview.model";
import Product from "@/models/product.model";
import mongoose from "mongoose";

type RouteParams = {
  params: Promise<{ reviewId: string }>;
};

async function requireAdmin(request: NextRequest) {
  const decoded = await fetchTokenDetails(request);
  return decoded && decoded.role === "admin";
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

    const { reviewId } = await params;
    if (!reviewId) {
      return NextResponse.json(
        { success: false, message: "Review ID is required" },
        { status: 400 }
      );
    }

    // 1. Try deleting from HomeReview
    if (mongoose.Types.ObjectId.isValid(reviewId)) {
      const deletedHomeReview = await HomeReview.findByIdAndDelete(reviewId);
      if (deletedHomeReview) {
        return NextResponse.json({
          success: true,
          message: "Testimonial deleted successfully",
        });
      }
    }

    // 2. Try deleting from Product.reviews
    const product = await Product.findOne({ "reviews._id": reviewId });
    if (product && Array.isArray(product.reviews)) {
      product.reviews = product.reviews.filter(
        (r: any) => r._id?.toString() !== reviewId
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
        numReviews: product.numReviews,
        rating: product.rating,
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
