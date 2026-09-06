import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import HomeReview from "@/models/homeReview.model";
import Product from "@/models/product.model";
import cloudinary from "cloudinary";

type EmbeddedReview = {
  _id?: string;
  username?: string;
  rating: number;
  comment: string;
  photos?: string[];
  createdAt?: Date | string;
};

type ProductWithReviews = {
  _id: string;
  title: string;
  image?: string;
  images?: string[];
  reviews?: EmbeddedReview[];
};

export async function GET() {
  try {
    await databaseConnection();

    const [products, featuredReviews] = (await Promise.all([
      Product.find({
        isActive: true,
        "reviews.0": { $exists: true },
      })
        .select("title image images reviews")
        .lean(),
      HomeReview.find({ isVisible: true }).sort({ createdAt: -1 }).lean(),
    ])) as unknown as [
      ProductWithReviews[],
      Array<{
        _id: string;
        username: string;
        rating: number;
        comment: string;
        productTitle?: string;
        productImage?: string;
        createdAt?: Date | string;
      }>,
    ];

    const customerReviews = products
      .flatMap((product) =>
        (product.reviews || []).map((review) => ({
          _id: review._id?.toString() || `${product._id}-${review.createdAt}`,
          username: review.username || "Verified Customer",
          rating: review.rating,
          comment: review.comment,
          photos: review.photos || [],
          image:
            review.photos?.[0] || product.image || product.images?.[0] || "",
          createdAt: review.createdAt,
          product: {
            _id: product._id.toString(),
            title: product.title,
            image: product.image || product.images?.[0] || "",
          },
        })),
      )
      .sort(
        (first, second) =>
          new Date(second.createdAt || 0).getTime() -
          new Date(first.createdAt || 0).getTime(),
      );

    const reviews = [
      ...featuredReviews.map((review) => ({
        _id: review._id.toString(),
        username: review.username,
        rating: review.rating,
        comment: review.comment,
        photos: [],
        image: review.productImage || "",
        createdAt: review.createdAt,
        isFeatured: true,
        product: {
          _id: "",
          title: review.productTitle || "Our lovely collection",
          image: review.productImage || "",
        },
      })),
      ...customerReviews,
    ]
      .sort(
        (first, second) =>
          new Date(second.createdAt || 0).getTime() -
          new Date(first.createdAt || 0).getTime(),
      )
      .slice(0, 6);

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error("Error loading homepage reviews:", error);
    return NextResponse.json(
      { success: false, reviews: [], message: "Unable to load reviews" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await databaseConnection();
    const decoded = await fetchTokenDetails(request);

    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin role required." },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const usernameValue = formData.get("username");
    const commentValue = formData.get("comment");
    const username =
      typeof usernameValue === "string" ? usernameValue.trim() : "";
    const comment = typeof commentValue === "string" ? commentValue.trim() : "";
    const rating = Number(formData.get("rating"));
    const image = formData.get("image");

    if (
      !username ||
      !comment ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      !(image instanceof File) ||
      image.size === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, comment, rating, and an image upload are required.",
        },
        { status: 400 },
      );
    }

    if (!image.type.startsWith("image/") || image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "Upload an image smaller than 5 MB." },
        { status: 400 },
      );
    }

    await cloudinaryConnection();
    const arrayBuffer = await image.arrayBuffer();
    const dataURI = `data:${image.type};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
    const upload = await cloudinary.v2.uploader.upload(dataURI, {
      folder: "basics-home-reviews",
    });

    const productTitleValue = formData.get("productTitle");
    const review = await HomeReview.create({
      username,
      comment,
      rating,
      productTitle:
        typeof productTitleValue === "string"
          ? productTitleValue.trim()
          : undefined,
      productImage: upload.secure_url,
      isVisible: formData.get("isVisible") !== "false",
    });

    return NextResponse.json(
      { success: true, review, message: "Homepage review added successfully." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating homepage review:", error);
    return NextResponse.json(
      { success: false, message: "Unable to create homepage review." },
      { status: 500 },
    );
  }
}
