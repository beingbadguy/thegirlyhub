import { databaseConnection } from "@/config/databseConnection";
import Wishlist from "@/models/wishlist.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";

interface WishlistProduct {
  _id: string;
  productId: {
    _id: string;
    title: string;
    description: string;
    price: number;
    discountedPrice: number;
    countInStock: number;
    rating: number;
    numReviews: number;
    image: string;
    discountPercentage: number;
    isActive: boolean;
    category: string;
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded?.userId) {
      return NextResponse.json(
        { message: "You must log in to manage your wishlist.", success: false },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { message: "Product id is required", success: false },
        { status: 400 }
      );
    }

    // Atomic update or insert with $addToSet to avoid duplicates and race conditions
    const existing = await Wishlist.findOne({
      userId: decoded.userId,
      "products.productId": id,
    }).select("_id").lean();

    if (existing) {
      return NextResponse.json({ message: "Product already in wishlist", success: true });
    }

    await Wishlist.findOneAndUpdate(
      { userId: decoded.userId },
      { $push: { products: { productId: id } } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ message: "Product added to wishlist", success: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error updating wishlist", success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded?.userId) {
      return NextResponse.json(
        { message: "You must log in to manage your wishlist.", success: false },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { message: "Product id is required", success: false },
        { status: 400 }
      );
    }

    const updated = await Wishlist.findOneAndUpdate(
      { userId: decoded.userId },
      { $pull: { products: { productId: id } } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ message: "Wishlist not found.", success: false }, { status: 404 });
    }

    return NextResponse.json({ message: "Product removed from wishlist", success: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error removing from wishlist", success: false },
      { status: 500 }
    );
  }
}
