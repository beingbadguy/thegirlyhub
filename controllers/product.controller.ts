import { NextRequest, NextResponse } from "next/server";
import Product from "@/models/product.model";
import ProductLog from "@/models/productLog.model";
import { productCreateSchema, productUpdateSchema } from "@/lib/validations/product.schema";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { generateUniqueSlug, extractIdFromSlug, slugify } from "@/lib/slug";
import mongoose from "mongoose";

// Helper to find a product by database ID or Slug
async function findProductBySlugOrId(identifier: string) {
  if (!identifier) return null;
  const decoded = decodeURIComponent(identifier).trim();

  if (mongoose.Types.ObjectId.isValid(decoded)) {
    const byId = await Product.findById(decoded);
    if (byId) return byId;
  }

  const bySlug = await Product.findOne({ slug: decoded });
  if (bySlug) return bySlug;

  const idFromSlug = extractIdFromSlug(decoded);
  if (idFromSlug && mongoose.Types.ObjectId.isValid(idFromSlug)) {
    const byPartialId = await Product.findById(idFromSlug);
    if (byPartialId) return byPartialId;
  }

  const baseSlug = decoded.replace(/-[a-f0-9]{4,6}$/i, "");
  const byBaseSlug = await Product.findOne({
    $or: [
      { slug: new RegExp(`^${baseSlug}`, "i") },
      { title: new RegExp(`^${baseSlug.replace(/-/g, " ")}`, "i") },
    ],
  });
  return byBaseSlug || null;
}

export class ProductController {
  // Create Product (Admin Only)
  static async create(request: NextRequest) {
    try {
      const decoded = await fetchTokenDetails(request);
      if (!decoded || decoded.role !== "admin") {
        return NextResponse.json(
          { success: false, message: "Unauthorized. Admin privileges required." },
          { status: 401 }
        );
      }

      const body = await request.json();

      // Normalize inputs
      if (body.title && !body.name) body.name = body.title;
      if (body.name && !body.title) body.title = body.name;
      if (body.stock !== undefined && body.totalStock === undefined) body.totalStock = body.stock;
      if (body.discountPrice !== undefined && body.sellingPrice === undefined) body.sellingPrice = body.discountPrice;
      if (body.sellingPrice !== undefined && body.discountPrice === undefined) body.discountPrice = body.sellingPrice;

      // Handle tags array if string passed
      if (typeof body.tags === "string") {
        body.tags = body.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      }

      // Handle images array if mainImage is provided
      if (Array.isArray(body.images)) {
        body.images = Array.from(new Set(body.images.map((img: any) => String(img).trim()).filter(Boolean)));
        if (body.images.length > 0 && !body.mainImage) {
          body.mainImage = body.images[0];
          body.image = body.images[0];
        }
      } else if (body.mainImage) {
        body.images = [body.mainImage];
        body.image = body.mainImage;
      }


      // Validate with Zod
      const validation = productCreateSchema.safeParse(body);
      if (!validation.success) {
        const errorFormatted = validation.error.format();
        const firstErrorMsg =
          validation.error.issues?.[0]?.message || "Validation failed";
        return NextResponse.json(
          {
            success: false,
            message: firstErrorMsg,
            errors: errorFormatted,
          },
          { status: 400 }
        );
      }

      const validatedData = validation.data;
      const titleToSlug = validatedData.title || validatedData.name || "Product";

      // Auto-generate unique slug
      const uniqueSlug = validatedData.slug
        ? slugify(validatedData.slug)
        : await generateUniqueSlug(Product, titleToSlug);

      const isPublished =
        validatedData.isActive !== false && validatedData.status !== "draft" && validatedData.status !== "archived";

      // Save new product
      const product = new Product({
        ...validatedData,
        title: titleToSlug,
        name: titleToSlug,
        slug: uniqueSlug,
        isActive: isPublished,
        status: validatedData.status || (isPublished ? "active" : "draft"),
      });

      await product.save();

      // Track log in DB
      try {
        await ProductLog.create({
          action: "create",
          productId: product._id,
          productTitle: product.title,
          productSlug: product.slug,
          performedBy: decoded?.userId || null,
          adminEmail: decoded?.email || null,
          changes: {
            title: product.title,
            price: product.price,
            discountPrice: product.discountPrice,
            stock: product.stock,
            category: product.category,
            status: product.status,
          },
          details: `Product "${product.title}" created by ${decoded?.email || "admin"}`,
          timestamp: new Date(),
        });
      } catch (logErr) {
        console.error("Error creating product log:", logErr);
      }

      return NextResponse.json(
        {
          success: true,
          data: product,
          message: "Product created successfully",
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error("Error creating product:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  }

  // Get All Products (With Search, Filter, Pagination, Sorting)
  static async getAll(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);

      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
      const skip = (page - 1) * limit;

      const search = (searchParams.get("search") || searchParams.get("q") || "").trim();
      const category = (searchParams.get("category") || "").trim();
      const status = (searchParams.get("status") || "").trim();
      const isFeatured = searchParams.get("isFeatured") || searchParams.get("featured");
      const sort = (searchParams.get("sort") || "newest").trim();
      const includeAll = searchParams.get("all") === "true"; // include drafts for admin dashboard

      // Build filter query
      const filter: any = {};

      if (!includeAll) {
        if (status && status !== "all") {
          filter.status = status;
        }
      } else if (status && status !== "all") {
        filter.status = status;
      }

      if (category && category !== "all") {
        filter.category = { $regex: new RegExp(`^${category}$`, "i") };
      }

      if (isFeatured === "true") {
        filter.$or = [{ isFeatured: true }, { status: "featured" }];
      } else if (isFeatured === "false") {
        filter.isFeatured = false;
      }

      if (search) {
        const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [
          { title: searchRegex },
          { name: searchRegex },
          { description: searchRegex },
          { shortDescription: searchRegex },
          { category: searchRegex },
          { tags: searchRegex },
          { slug: searchRegex },
        ];
      }

      // Build sorting options
      let sortOptions: any = { createdAt: -1 };
      if (sort === "low-to-high" || sort === "priceLowToHigh" || sort === "price-low") {
        sortOptions = { sellingPrice: 1, discountPrice: 1, price: 1 };
      } else if (sort === "high-to-low" || sort === "priceHighToLow" || sort === "price-high" || sort === "price") {
        sortOptions = { sellingPrice: -1, discountPrice: -1, price: -1 };
      } else if (sort === "stock" || sort === "stock-high") {
        sortOptions = { totalStock: -1, stock: -1 };
      } else if (sort === "stock-low") {
        sortOptions = { totalStock: 1, stock: 1 };
      } else if (sort === "rating" || sort === "ratingHighToLow") {
        sortOptions = { averageRating: -1, ratings: -1 };
      } else if (sort === "title" || sort === "name") {
        sortOptions = { title: 1 };
      }

      // Query database
      const [products, total] = await Promise.all([
        Product.find(filter)
          .select(
            "title name description shortDescription longDescription price costPrice sellingPrice discountedPrice discountPrice discountPercentage image mainImage images category subCategory brand countInStock stock totalStock lowStockThreshold rating ratings averageRating numReviews totalReviews status isFeatured isNewArrival tags metaTitle metaDescription createdAt updatedAt isActive slug"
          )
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(filter),
      ]);

      return NextResponse.json(
        {
          success: true,
          data: products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          message: "Products fetched successfully",
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  }

  // Get Single Product by slug or ID
  static async getOne(request: NextRequest, identifier: string) {
    try {
      if (!identifier) {
        return NextResponse.json(
          { success: false, message: "Product identifier is required" },
          { status: 400 }
        );
      }

      const product = await findProductBySlugOrId(identifier);
      if (!product) {
        return NextResponse.json(
          { success: false, message: "Product not found" },
          { status: 404 }
        );
      }

      // Fetch recent product activity logs if available
      let activityLogs: any[] = [];
      try {
        activityLogs = await ProductLog.find({ productId: product._id })
          .sort({ timestamp: -1 })
          .limit(10)
          .lean();
      } catch (err) {
        console.error("Error fetching activity logs for product:", err);
      }

      return NextResponse.json(
        {
          success: true,
          data: product,
          logs: activityLogs,
          message: "Product fetched successfully",
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Error fetching single product:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  }

  // Update Product (Admin Only)
  static async update(request: NextRequest, identifier: string) {
    try {
      const decoded = await fetchTokenDetails(request);
      if (!decoded || decoded.role !== "admin") {
        return NextResponse.json(
          { success: false, message: "Unauthorized. Admin privileges required." },
          { status: 401 }
        );
      }

      if (!identifier) {
        return NextResponse.json(
          { success: false, message: "Product identifier is required" },
          { status: 400 }
        );
      }

      const product = await findProductBySlugOrId(identifier);
      if (!product) {
        return NextResponse.json(
          { success: false, message: "Product not found" },
          { status: 404 }
        );
      }

      const body = await request.json();

      // Normalize inputs
      if (body.title && !body.name) body.name = body.title;
      if (body.name && !body.title) body.title = body.name;
      if (body.stock !== undefined && body.totalStock === undefined) body.totalStock = body.stock;
      if (body.discountPrice !== undefined && body.sellingPrice === undefined) body.sellingPrice = body.discountPrice;
      if (body.sellingPrice !== undefined && body.discountPrice === undefined) body.discountPrice = body.sellingPrice;

      if (typeof body.tags === "string") {
        body.tags = body.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      }

      if (Array.isArray(body.images)) {
        body.images = Array.from(new Set(body.images.map((img: any) => String(img).trim()).filter(Boolean)));
        if (body.images.length > 0 && !body.mainImage) {
          body.mainImage = body.images[0];
          body.image = body.images[0];
        }
      } else if (body.mainImage) {
        body.images = [body.mainImage];
        body.image = body.mainImage;
      }


      // Validate with Zod
      const validation = productUpdateSchema.safeParse(body);
      if (!validation.success) {
        const firstErrorMsg =
          validation.error.issues?.[0]?.message || "Validation failed";
        return NextResponse.json(
          {
            success: false,
            message: firstErrorMsg,
            errors: validation.error.format(),
          },
          { status: 400 }
        );
      }

      const updateData = validation.data;

      // Update fields on existing document
      Object.keys(updateData).forEach((key) => {
        if ((updateData as any)[key] !== undefined) {
          (product as any)[key] = (updateData as any)[key];
        }
      });

      // Recalculate slug if title changed or custom slug provided
      if (updateData.title && updateData.title !== product.title) {
        product.slug = await generateUniqueSlug(Product, updateData.title, product._id.toString());
      } else if (updateData.slug && updateData.slug !== product.slug) {
        product.slug = await generateUniqueSlug(Product, updateData.slug, product._id.toString());
      }

      if (updateData.isActive !== undefined) {
        product.isActive = updateData.isActive;
        if (!updateData.status) {
          product.status = updateData.isActive ? "active" : "draft";
        }
      }

      product.updatedAt = new Date();
      await product.save();

      // Track log in DB
      try {
        await ProductLog.create({
          action: "update",
          productId: product._id,
          productTitle: product.title,
          productSlug: product.slug,
          performedBy: decoded?.userId || null,
          adminEmail: decoded?.email || null,
          changes: updateData,
          details: `Product "${product.title}" updated by ${decoded?.email || "admin"}`,
          timestamp: new Date(),
        });
      } catch (logErr) {
        console.error("Error creating product update log:", logErr);
      }

      return NextResponse.json(
        {
          success: true,
          data: product,
          message: "Product updated successfully",
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Error updating product:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  }

  // Delete Product (Admin Only)
  static async delete(request: NextRequest, identifier: string) {
    try {
      const decoded = await fetchTokenDetails(request);
      if (!decoded || decoded.role !== "admin") {
        return NextResponse.json(
          { success: false, message: "Unauthorized. Admin privileges required." },
          { status: 401 }
        );
      }

      if (!identifier) {
        return NextResponse.json(
          { success: false, message: "Product identifier is required" },
          { status: 400 }
        );
      }

      const product = await findProductBySlugOrId(identifier);
      if (!product) {
        return NextResponse.json(
          { success: false, message: "Product not found" },
          { status: 404 }
        );
      }

      const deletedId = product._id;
      const deletedTitle = product.title;
      const deletedSlug = product.slug;

      await Product.findByIdAndDelete(deletedId);

      // Track log in DB
      try {
        await ProductLog.create({
          action: "delete",
          productId: deletedId,
          productTitle: deletedTitle,
          productSlug: deletedSlug,
          performedBy: decoded?.userId || null,
          adminEmail: decoded?.email || null,
          details: `Product "${deletedTitle}" permanently deleted by ${decoded?.email || "admin"}`,
          timestamp: new Date(),
        });
      } catch (logErr) {
        console.error("Error creating product deletion log:", logErr);
      }

      return NextResponse.json(
        {
          success: true,
          message: "Product deleted successfully",
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Error deleting product:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  }
}
