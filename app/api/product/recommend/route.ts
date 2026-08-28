import { databaseConnection } from "@/config/databseConnection";
import Product from "@/models/product.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { buildProductSlug, extractIdFromSlug, slugify } from "@/lib/slug";

async function findProductBySlugOrId(identifier: string) {
  const decoded = decodeURIComponent(identifier);

  if (mongoose.Types.ObjectId.isValid(decoded)) {
    const byId = await Product.findById(decoded);
    if (byId) return byId;
  }

  const bySlug = await Product.findOne({ slug: decoded });
  if (bySlug) return bySlug;

  const idFromSlug = extractIdFromSlug(decoded);
  if (idFromSlug) {
    const byPartialId = await Product.findById(idFromSlug);
    if (byPartialId) return byPartialId;
  }

  const baseSlug = decoded.replace(/-[a-f0-9]{6}$/i, "");
  const products = await Product.find({});
  return (
    products.find(
      (p) =>
        p.slug === decoded ||
        slugify(p.title) === baseSlug ||
        buildProductSlug(p.title, p._id.toString()) === decoded,
    ) ?? null
  );
}

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const productId = searchParams.get("productId");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 4;

    let targetProduct = null;

    if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      targetProduct = await Product.findById(productId);
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
        .sort({ rating: -1, createdAt: -1 })
        .limit(limit);

      recommendedProducts = [...categoryProducts];

      // 2. If we need more products to reach the limit, fetch active products from other categories
      if (recommendedProducts.length < limit) {
        const excludedIds = [targetProduct._id, ...recommendedProducts.map((p) => p._id)];
        const additionalProducts = await Product.find({
          isActive: true,
          _id: { $nin: excludedIds },
        })
          .sort({ rating: -1, createdAt: -1 })
          .limit(limit - recommendedProducts.length);
        
        recommendedProducts = [...recommendedProducts, ...additionalProducts];
      }
    } else {
      // No reference product: return general recommendations
      recommendedProducts = await Product.find({ isActive: true })
        .sort({ rating: -1, createdAt: -1 })
        .limit(limit);
    }

    return NextResponse.json(
      {
        success: true,
        products: recommendedProducts,
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
