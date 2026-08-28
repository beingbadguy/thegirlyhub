import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import mongoose from "mongoose";
import cloudinary from "cloudinary";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  await databaseConnection();
  cloudinaryConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please log in to post a review." },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 1. Resolve product by database ID or slug
    const product = mongoose.Types.ObjectId.isValid(id)
      ? await Product.findById(id)
      : await Product.findOne({ slug: id });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // 2. Verify eligibility (status delivered/completed + order contains the product)
    const hasOrder = await Order.findOne({
      userId: decoded.userId,
      status: { $in: ["delivered", "completed"] },
      "products.productId": product._id,
    });

    if (!hasOrder) {
      return NextResponse.json(
        {
          success: false,
          message: "Only customers who have purchased and received this product can review it.",
        },
        { status: 403 }
      );
    }

    // 3. Parse and validate form fields
    const formData = await request.formData();
    const ratingInput = formData.get("rating");
    const comment = formData.get("comment") as string;

    if (!ratingInput || !comment?.trim()) {
      return NextResponse.json(
        { success: false, message: "Rating and comment text are required." },
        { status: 400 }
      );
    }

    const rating = Number(ratingInput);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be a number between 1 and 5." },
        { status: 400 }
      );
    }

    // 4. Validate and upload photos (Max 4)
    const photoFiles = formData.getAll("photos") as File[];
    
    // Filter out empty files
    const validPhotoFiles = photoFiles.filter(file => file && file.size > 0);

    if (validPhotoFiles.length > 4) {
      return NextResponse.json(
        { success: false, message: "You can upload a maximum of 4 photos." },
        { status: 400 }
      );
    }

    const photoUrls: string[] = [];
    for (const file of validPhotoFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const base64String = Buffer.from(arrayBuffer).toString("base64");
      const dataURI = `data:${file.type};base64,${base64String}`;
      
      const uploadResponse = await cloudinary.v2.uploader.upload(dataURI, {
        folder: "basicsreviews",
      });
      photoUrls.push(uploadResponse.secure_url);
    }

    // 5. Retrieve user details
    const user = await User.findById(decoded.userId).lean() as { name?: string } | null;
    const username = user?.name || "Verified Customer";

    // 6. Append review
    const review = {
      userId: decoded.userId,
      username,
      rating,
      comment,
      photos: photoUrls,
      createdAt: new Date(),
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    
    const totalRating = product.reviews.reduce((acc: number, item: { rating: number }) => acc + item.rating, 0);
    product.ratings = totalRating / product.reviews.length;

    await product.save();

    return NextResponse.json(
      {
        success: true,
        data: review,
        message: "Review posted successfully!",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error posting review:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
