import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

const MAX_RECENT_PRODUCTS = 8;

export async function GET(request: NextRequest) {
  await databaseConnection();
  const decoded = await fetchTokenDetails(request);

  if (!decoded) {
    return NextResponse.json({ products: [], success: true });
  }

  const user = (await User.findById(decoded.userId)
    .select("recentlyViewed")
    .populate({
      path: "recentlyViewed",
      match: { status: "active" },
      options: { sort: { createdAt: -1 } },
    })
    .lean()) as { recentlyViewed?: unknown[] } | null;

  return NextResponse.json({
    products: (user?.recentlyViewed ?? []).slice(0, MAX_RECENT_PRODUCTS),
    success: true,
  });
}

export async function POST(request: NextRequest) {
  await databaseConnection();
  const decoded = await fetchTokenDetails(request);

  if (!decoded) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 },
    );
  }

  const { productId } = await request.json();
  if (!productId) {
    return NextResponse.json(
      { success: false, message: "Product id is required" },
      { status: 400 },
    );
  }

  const product = (await Product.findOne({ _id: productId, status: "active" })
    .select("_id")
    .lean()) as { _id: string } | null;
  if (!product) {
    return NextResponse.json(
      { success: false, message: "Product not found" },
      { status: 404 },
    );
  }

  await User.findByIdAndUpdate(decoded.userId, {
    $pull: { recentlyViewed: product._id },
  });
  await User.findByIdAndUpdate(decoded.userId, {
    $push: {
      recentlyViewed: {
        $each: [product._id],
        $position: 0,
        $slice: MAX_RECENT_PRODUCTS,
      },
    },
  });

  return NextResponse.json({ success: true });
}
