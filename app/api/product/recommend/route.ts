import { databaseConnection } from "@/config/databseConnection";
import Product from "@/models/product.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { findProductBySlugOrId } from "@/controllers/product.controller";

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const productId = searchParams.get("productId");
    const limitParam = searchParams.get("limit");
    const limit = Math.max(1, limitParam ? parseInt(limitParam, 10) : 4);

    let targetProduct: any = null;

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      targetProduct = await Product.findById(productId).lean();
    }

    if (!targetProduct && slug) {
      targetProduct = await findProductBySlugOrId(slug);
    }

    let recommendedProducts: any[] = [];

    if (targetProduct) {
      // 1. Fetch active products in the same category, excluding the current one
      const categoryProducts = await Product.find({
        isActive: true,
        category: targetProduct.category,
        _id: { $ne: targetProduct._id },
      })
        .sort({ ratings: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      recommendedProducts = [...categoryProducts];

      // 2. If we need more products to reach the limit, fetch active products from other categories
      if (recommendedProducts.length < limit) {
        const excludedIds = [targetProduct._id, ...recommendedProducts.map((p) => p._id)];
        const additionalProducts = await Product.find({
          isActive: true,
          _id: { $nin: excludedIds },
        })
          .sort({ ratings: -1, createdAt: -1 })
          .limit(limit - recommendedProducts.length)
          .lean();

        recommendedProducts = [...recommendedProducts, ...additionalProducts];
      }
    } else {
      // No reference product: return general top-rated/recent active recommendations
      recommendedProducts = await Product.find({ isActive: true })
        .sort({ ratings: -1, createdAt: -1 })
        .limit(limit)
        .lean();
    }

    return NextResponse.json(
      {
        success: true,
        products: recommendedProducts,
        data: recommendedProducts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in recommended products API:", error);
    return NextResponse.json(
      {
        message: "Error fetching recommended products",
        success: false,
      },
      { status: 500 }
    );
  }
}
