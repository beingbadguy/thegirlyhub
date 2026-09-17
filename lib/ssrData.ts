import { databaseConnection } from "@/config/databseConnection";
import Category from "@/models/category.model";
import Product from "@/models/product.model";

export type SSRCategory = {
  _id: string;
  name: string;
  categoryImage: string;
  productImages?: string[];
  productCount?: number;
};

export type SSRProduct = {
  _id: string;
  title: string;
  name?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  sellingPrice?: number;
  discountedPrice: number;
  discountPrice?: number;
  discountPercentage: number;
  image: string;
  mainImage?: string;
  images: string[];
  category: string;
  brand?: string;
  countInStock: number;
  stock?: number;
  totalStock?: number;
  rating?: number;
  ratings?: number;
  averageRating?: number;
  numReviews?: number;
  totalReviews?: number;
  status?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isActive: boolean;
  slug?: string;
  createdAt?: string;
};

function normalizeSSRProduct(p: any): SSRProduct {
  const idStr = p._id ? p._id.toString() : "";
  const title = p.title || p.name || "Product";
  const image =
    p.mainImage ||
    p.image ||
    (Array.isArray(p.images) && p.images[0]) ||
    "/placeholder.png";
  const images =
    Array.isArray(p.images) && p.images.length > 0
      ? p.images.filter(Boolean)
      : image
        ? [image]
        : [];
  const price = Number(p.price ?? p.sellingPrice ?? 0);
  const discountedPrice = Number(
    p.discountedPrice ?? p.discountPrice ?? p.sellingPrice ?? price,
  );
  const discountPercentage =
    p.discountPercentage ??
    (price > 0 && price > discountedPrice
      ? Math.round(((price - discountedPrice) / price) * 100)
      : 0);
  const countInStock = Number(
    p.countInStock ?? p.stock ?? p.totalStock ?? 0,
  );

  return {
    _id: idStr,
    title,
    name: title,
    description: p.description || p.shortDescription || "",
    shortDescription: p.shortDescription || p.description || "",
    price,
    sellingPrice: discountedPrice,
    discountedPrice,
    discountPrice: discountedPrice,
    discountPercentage,
    image,
    mainImage: image,
    images,
    category: p.category || "jewellery",
    brand: p.brand || "GirlyHub",
    countInStock,
    stock: countInStock,
    totalStock: countInStock,
    rating: p.averageRating ?? p.rating ?? p.ratings ?? 0,
    ratings: p.averageRating ?? p.rating ?? p.ratings ?? 0,
    averageRating: p.averageRating ?? p.rating ?? p.ratings ?? 0,
    numReviews: p.totalReviews ?? p.numReviews ?? 0,
    totalReviews: p.totalReviews ?? p.numReviews ?? 0,
    status: p.status || "active",
    isFeatured: Boolean(p.isFeatured),
    isNewArrival: Boolean(p.isNewArrival),
    isActive: p.isActive !== false && p.status !== "draft" && p.status !== "archived",
    slug: p.slug || idStr,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
  };
}

/**
 * Server-Side Fetch: Categories with sample product images and counts
 */
export async function getSSRHomeCategories(limit = 12): Promise<SSRCategory[]> {
  try {
    await databaseConnection();

    const categories = await Category.find({
      isActive: { $ne: false },
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (!categories || categories.length === 0) {
      return [];
    }

    const categoryNames = categories.map((c: any) => c.name);
    const lowerNames = categoryNames.map((n: string) => n.toLowerCase());

    const productData = await Product.aggregate([
      {
        $match: {
          category: { $in: [...categoryNames, ...lowerNames] },
          isActive: { $ne: false },
        },
      },
      {
        $group: {
          _id: "$category",
          productCount: { $sum: 1 },
          productImages: { $push: "$image" },
        },
      },
      {
        $project: {
          productCount: 1,
          productImages: { $slice: ["$productImages", 4] },
        },
      },
    ]);

    const countsMap = new Map<string, { productCount: number; productImages: string[] }>();
    for (const item of productData) {
      if (item._id) {
        countsMap.set(String(item._id).toLowerCase(), {
          productCount: item.productCount || 0,
          productImages: (item.productImages || []).filter(Boolean),
        });
      }
    }

    return categories.map((c: any) => {
      const match =
        countsMap.get(c.name.toLowerCase()) ||
        countsMap.get(c.name) || { productCount: 0, productImages: [] };

      return {
        _id: c._id ? c._id.toString() : "",
        name: c.name,
        categoryImage: c.categoryImage || match.productImages[0] || "/placeholder.png",
        productImages: match.productImages,
        productCount: match.productCount,
      };
    });
  } catch (error) {
    console.error("Error fetching SSR categories:", error);
    return [];
  }
}

/**
 * Server-Side Fetch: Products with filter options
 */
export async function getSSRProducts(options: {
  category?: string;
  featured?: boolean;
  limit?: number;
  page?: number;
  sort?: string;
  maxPrice?: number;
} = {}): Promise<{
  products: SSRProduct[];
  total: number;
  totalPages: number;
  page: number;
}> {
  try {
    await databaseConnection();

    const limit = options.limit ?? 12;
    const page = options.page ?? 1;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      isActive: { $ne: false },
      status: { $nin: ["draft", "archived"] },
    };

    if (options.category) {
      filter.category = {
        $regex: new RegExp(`^${options.category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      };
    }

    if (options.featured) {
      filter.$or = [{ isFeatured: true }, { status: "featured" }];
    }

    if (options.maxPrice && options.maxPrice < 100000) {
      filter.discountedPrice = { $lte: options.maxPrice };
    }

    let sortOption: Record<string, any> = { createdAt: -1 };
    if (options.sort === "priceLowToHigh") {
      sortOption = { discountedPrice: 1 };
    } else if (options.sort === "priceHighToLow") {
      sortOption = { discountedPrice: -1 };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .select(
          "title name description shortDescription price sellingPrice discountedPrice discountPrice discountPercentage image mainImage images category brand countInStock stock totalStock rating ratings averageRating numReviews totalReviews status isFeatured isNewArrival createdAt isActive slug",
        )
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const normalized = products.map(normalizeSSRProduct);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      products: normalized,
      total,
      totalPages,
      page,
    };
  } catch (error) {
    console.error("Error fetching SSR products:", error);
    return {
      products: [],
      total: 0,
      totalPages: 1,
      page: 1,
    };
  }
}
