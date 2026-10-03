import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import Product from "@/models/product.model";
import Category from "@/models/category.model";

export const dynamic = "force-dynamic";

export interface SuggestProduct {
  _id: string;
  title: string;
  slug: string;
  image: string;
  price: number;
  discountedPrice: number;
  discountPercentage: number;
  stock: number;
  category: string;
}

export interface SuggestCategory {
  _id?: string;
  name: string;
  slug?: string;
  categoryImage?: string;
  productCount?: number;
}

export async function GET(request: NextRequest) {
  try {
    await databaseConnection();

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "6", 10)), 12);

    // Default popular searches for empty/short query
    const popularSearches = [
      "Jhumkas",
      "Hair Claws",
      "Bracelets",
      "Bangels",
      "Pendants",
      "Scrunchies",
      "Oxidised Earrings",
    ];

    if (!query || query.length < 1) {
      // Return top active categories and top featured products for instant view
      const [categories, trendingProducts] = await Promise.all([
        Category.find({ isActive: { $ne: false }, isDeleted: { $ne: true } })
          .sort({ createdAt: -1 })
          .limit(6)
          .select("name categoryImage")
          .lean(),
        Product.find({
          isActive: { $ne: false },
          status: { $nin: ["draft", "archived"] },
        })
          .sort({ isFeatured: -1, averageRating: -1, createdAt: -1 })
          .limit(4)
          .select("title name slug image mainImage images price sellingPrice discountedPrice discountPrice discountPercentage totalStock stock countInStock category")
          .lean(),
      ]);

      const formattedProducts: SuggestProduct[] = trendingProducts.map((p: any) => {
        const title = p.title || p.name || "Product";
        const price = Number(p.price || p.sellingPrice || 0);
        const discountedPrice = Number(p.discountedPrice || p.discountPrice || p.sellingPrice || price);
        const discountPercentage =
          p.discountPercentage ||
          (price > discountedPrice && price > 0
            ? Math.round(((price - discountedPrice) / price) * 100)
            : 0);
        const image =
          p.image ||
          p.mainImage ||
          (Array.isArray(p.images) && p.images[0]) ||
          "";
        const stock = Number(p.totalStock ?? p.stock ?? p.countInStock ?? 0);

        return {
          _id: String(p._id),
          title,
          slug: p.slug || "",
          image,
          price,
          discountedPrice,
          discountPercentage,
          stock,
          category: p.category || "",
        };
      });

      return NextResponse.json({
        success: true,
        query: "",
        total: 0,
        products: formattedProducts,
        categories: categories.map((c: any) => ({
          _id: String(c._id),
          name: c.name,
          categoryImage: c.categoryImage || "",
        })),
        popularSearches,
      });
    }

    // Escape regex metacharacters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedQuery, "i");

    // Parallel fetch matching categories, products, and total count
    const [matchingCategories, matchingProducts, totalMatchingProducts] = await Promise.all([
      // 1. Categories matching query directly
      Category.find({
        name: regex,
        isActive: { $ne: false },
        isDeleted: { $ne: true },
      })
        .limit(4)
        .select("name categoryImage")
        .lean(),

      // 2. Products matching query
      Product.find({
        isActive: { $ne: false },
        status: { $nin: ["draft", "archived"] },
        $or: [
          { title: regex },
          { name: regex },
          { category: regex },
          { tags: regex },
          { slug: regex },
        ],
      })
        .sort({ isFeatured: -1, averageRating: -1, createdAt: -1 })
        .limit(limit)
        .select("title name slug image mainImage images price sellingPrice discountedPrice discountPrice discountPercentage totalStock stock countInStock category")
        .lean(),

      // 3. Count total matching products
      Product.countDocuments({
        isActive: { $ne: false },
        status: { $nin: ["draft", "archived"] },
        $or: [
          { title: regex },
          { name: regex },
          { category: regex },
          { tags: regex },
          { slug: regex },
        ],
      }),
    ]);

    // Format products
    const formattedProducts: SuggestProduct[] = matchingProducts.map((p: any) => {
      const title = p.title || p.name || "Product";
      const price = Number(p.price || p.sellingPrice || 0);
      const discountedPrice = Number(p.discountedPrice || p.discountPrice || p.sellingPrice || price);
      const discountPercentage =
        p.discountPercentage ||
        (price > discountedPrice && price > 0
          ? Math.round(((price - discountedPrice) / price) * 100)
          : 0);
      const image =
        p.image ||
        p.mainImage ||
        (Array.isArray(p.images) && p.images[0]) ||
        "";
      const stock = Number(p.totalStock ?? p.stock ?? p.countInStock ?? 0);

      return {
        _id: String(p._id),
        title,
        slug: p.slug || "",
        image,
        price,
        discountedPrice,
        discountPercentage,
        stock,
        category: p.category || "",
      };
    });

    // Merge categories: direct matches + categories extracted from matching products
    const categoryMap = new Map<string, SuggestCategory>();
    matchingCategories.forEach((cat: any) => {
      categoryMap.set(cat.name.toLowerCase(), {
        _id: String(cat._id),
        name: cat.name,
        categoryImage: cat.categoryImage,
      });
    });

    // Add unique categories from products if not already in categoryMap
    formattedProducts.forEach((prod) => {
      if (prod.category) {
        const lower = prod.category.toLowerCase();
        if (!categoryMap.has(lower) && categoryMap.size < 5) {
          const capitalized = prod.category.charAt(0).toUpperCase() + prod.category.slice(1);
          categoryMap.set(lower, {
            name: capitalized,
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      query,
      total: totalMatchingProducts,
      products: formattedProducts,
      categories: Array.from(categoryMap.values()),
      popularSearches,
    });
  } catch (error: any) {
    console.error("Predictive search suggest error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch suggestions",
        products: [],
        categories: [],
        total: 0,
        popularSearches: [],
      },
      { status: 500 }
    );
  }
}
