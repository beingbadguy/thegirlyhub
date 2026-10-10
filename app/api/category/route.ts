import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import { databaseConnection } from "@/config/databseConnection";
import Category from "@/models/category.model";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "cloudinary";
import { getPagination, paginationResult } from "@/lib/pagination";
import { verifyAdmin } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  await databaseConnection();
  try {
    const { isAdmin, decoded } = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 401 },
      );
    }

    cloudinaryConnection();
    let name = "";
    let finalImageUrl = "";

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = ((formData.get("name") as string) || "").trim();
      const imageField =
        formData.get("image") ||
        formData.get("categoryImage") ||
        formData.get("imageUrl");

      if (imageField instanceof File && imageField.size > 0) {
        const arrayBuffer = await imageField.arrayBuffer();
        const base64String = Buffer.from(arrayBuffer).toString("base64");
        const dataURI = `data:${imageField.type};base64,${base64String}`;
        const categoryImageResponse = await cloudinary.v2.uploader.upload(dataURI, {
          folder: "girlyhub_categories",
        });
        finalImageUrl = categoryImageResponse.secure_url;
      } else if (typeof imageField === "string" && imageField.trim() !== "") {
        finalImageUrl = imageField.trim();
      }
    } else {
      const body = await request.json();
      name = (body.name || "").trim();
      finalImageUrl = (
        body.categoryImage ||
        body.image ||
        body.imageUrl ||
        ""
      ).trim();
    }

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Category name is required" },
        { status: 400 },
      );
    }

    const categoryAlreadyExists = await Category.findOne({
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      isDeleted: { $ne: true },
    });
    if (categoryAlreadyExists) {
      return NextResponse.json(
        { success: false, message: "A category with this name already exists." },
        { status: 400 },
      );
    }

    const category = await Category.create({
      name: name,
      categoryImage: finalImageUrl || "",
      isActive: true,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        category: category,
      },
      {
        status: 201,
      },
    );
  } catch (error: any) {
    console.error("Failed to create category:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to create category",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const { isAdmin } = await verifyAdmin(request);
    const searchParams = request.nextUrl.searchParams;
    const isDeletedView = searchParams.get("deleted") === "true";
    const isAll = searchParams.get("all") === "true";
    const includeProductImages = searchParams.get("includeProductImages") === "true";
    const sortBy = searchParams.get("sortBy") || "";
    const search = (searchParams.get("search") || "").trim();

    // 1. If fetching deleted categories for admin "Deleted" section
    if (isDeletedView) {
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, message: "Unauthorized. Admin privileges required." },
          { status: 401 },
        );
      }

      const deletedFilter: Record<string, any> = { isDeleted: true };
      if (search) {
        deletedFilter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      }

      const { page, limit, skip } = getPagination(request, 100);
      const [deletedCategories, total] = await Promise.all([
        Category.find(deletedFilter)
          .sort({ deletedAt: -1, updatedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("deletedBy", "name email")
          .lean(),
        Category.countDocuments(deletedFilter),
      ]);

      const formatted = deletedCategories.map((cat: any) => ({
        ...cat,
        id: cat._id?.toString(),
        productCount: 0,
        deletedAt: cat.deletedAt || cat.updatedAt,
      }));

      return NextResponse.json(
        {
          success: true,
          message: "Deleted categories fetched successfully",
          categories: formatted,
          data: formatted,
          pagination: paginationResult(page, limit, total),
        },
        { status: 200 },
      );
    }

    // 2. Aggregate eligible, active products per category
    // A product is eligible if:
    // - Not soft-deleted (isDeleted !== true)
    // - Active (isActive !== false)
    // - Published status (status not in draft or archived)
    const eligibleProductMatch: Record<string, any> = {
      isDeleted: { $ne: true },
      isActive: { $ne: false },
      status: { $nin: ["draft", "archived"] },
    };

    const productAgg = await Product.aggregate([
      { $match: eligibleProductMatch },
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$category" } } },
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

    const productCountsMap = new Map<string, { count: number; images: string[] }>();
    for (const item of productAgg) {
      if (item._id) {
        productCountsMap.set(String(item._id).trim(), {
          count: Number(item.productCount || 0),
          images: Array.isArray(item.productImages) ? item.productImages.filter(Boolean) : [],
        });
      }
    }

    // 3. Query categories
    // For storefront: MUST NOT be soft-deleted and MUST be active
    // For admin: active non-deleted categories
    const categoryFilter: Record<string, any> = {
      isDeleted: { $ne: true },
    };

    if (!isAdmin) {
      categoryFilter.isActive = { $ne: false };
    }

    if (search) {
      categoryFilter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }

    // Load categories to evaluate product counts across all
    const allMatchingCategories = await Category.find(categoryFilter)
      .populate("deletedBy", "name email")
      .lean();

    // Map each category to its eligible product count
    let processedCategories = allMatchingCategories.map((cat: any) => {
      const keyName = String(cat.name || "").toLowerCase().trim();
      const keyId = cat._id ? cat._id.toString().toLowerCase().trim() : "";
      const matchName = productCountsMap.get(keyName);
      const matchId = keyId ? productCountsMap.get(keyId) : null;

      const count = (matchName?.count || 0) + (matchId?.count || 0);
      const images = [...(matchName?.images || []), ...(matchId?.images || [])].slice(0, 4);

      return {
        ...cat,
        id: cat._id?.toString(),
        productCount: count,
        ...(includeProductImages ? { productImages: images } : {}),
      };
    });

    // 4. Storefront Filtering:
    // Only display categories that contain at least one eligible, active product.
    // Exclude categories with zero eligible products.
    // (If admin requests with ?all=true or isAdmin querying without onlyWithProducts, retain 0-product categories)
    const onlyWithProductsRequested = searchParams.get("onlyWithProducts") === "true";
    const isStorefront = !isAdmin || onlyWithProductsRequested;

    if (isStorefront) {
      processedCategories = processedCategories.filter((cat: any) => (cat.productCount || 0) > 0);
    }

    // 5. Sorting:
    // Display categories in descending order of eligible product count.
    // Highest product count first, lowest product count last.
    // Deterministic secondary sort: category name ascending.
    if (sortBy === "productCountAsc") {
      processedCategories.sort((a: any, b: any) => {
        const diff = (a.productCount || 0) - (b.productCount || 0);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      });
    } else if (sortBy === "name_asc") {
      processedCategories.sort((a: any, b: any) => a.name.localeCompare(b.name));
    } else if (sortBy === "name_desc") {
      processedCategories.sort((a: any, b: any) => b.name.localeCompare(a.name));
    } else if (sortBy === "newest" && isAdmin) {
      processedCategories.sort((a: any, b: any) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    } else {
      // Default storefront sort (Requirement 7):
      // Highest product count first. Lowest product count last.
      // Deterministic secondary sort: category name ascending.
      processedCategories.sort((a: any, b: any) => {
        const diff = (b.productCount || 0) - (a.productCount || 0);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      });
    }

    // 6. Pagination on the filtered and sorted list
    const total = processedCategories.length;
    const { page, limit, skip } = getPagination(request, isAll ? total || 1 : 12);
    const paginatedCategories = isAll
      ? processedCategories
      : processedCategories.slice(skip, skip + limit);

    return NextResponse.json(
      {
        success: true,
        message: "Categories fetched successfully",
        categories: paginatedCategories,
        data: paginatedCategories,
        pagination: paginationResult(isAll ? 1 : page, isAll ? total || 1 : limit, total),
      },
      {
        status: 200,
        headers: isAdmin
          ? {}
          : {
              "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
            },
      },
    );
  } catch (error: any) {
    console.error("Failed to get categories:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to get categories",
      },
      {
        status: 500,
      },
    );
  }
}
