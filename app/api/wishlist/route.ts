import { databaseConnection } from "@/config/databseConnection";
import Wishlist from "@/models/wishlist.model";
import { NextRequest, NextResponse } from "next/server";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded?.userId) {
      return NextResponse.json(
        { message: "You must log in to view your wishlist", success: false },
        { status: 401 }
      );
    }

    const wishlist = await Wishlist.findOne({
      userId: decoded.userId,
    })
      .populate({
        path: "products.productId",
        select:
          "title name price sellingPrice discountedPrice discountPrice image mainImage countInStock stock totalStock rating ratings averageRating numReviews totalReviews status isFeatured isActive slug",
      })
      .lean();

    if (!wishlist) {
      return NextResponse.json(
        {
          wishlist: { products: [] },
          success: true,
          message: "Wishlist is empty",
        },
        { status: 200 }
      );
    }

    const validProducts = ((wishlist as any).products || []).filter(
      (item: any) => item?.productId && item.productId._id
    );

    return NextResponse.json(
      {
        wishlist: {
          ...wishlist,
          products: validProducts,
        },
        success: true,
        message: "Wishlist fetched successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { message: "Error fetching wishlist", success: false },
      { status: 500 }
    );
  }
}
