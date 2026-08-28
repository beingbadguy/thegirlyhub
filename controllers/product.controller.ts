import { NextRequest, NextResponse } from "next/server";
import Product from "@/models/product.model";
import { productCreateSchema, productUpdateSchema } from "@/lib/validations/product.schema";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { buildProductSlug, extractIdFromSlug, slugify } from "@/lib/slug";
import mongoose from "mongoose";

// Helper to find a product by database ID or Slug
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
      
      // Validate with Zod
      const validation = productCreateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            message: "Validation failed",
            errors: validation.error.format(),
          },
          { status: 400 }
        );
      }

      const validatedData = validation.data;

      // Save new product
      const product = new Product({
        ...validatedData,
        isActive: true,
      });
      await product.save();

      // Build unique slug and update
      product.slug = buildProductSlug(product.title, product._id.toString());
      await product.save();

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

      const search = searchParams.get("search") || "";
      const category = searchParams.get("category") || "";
      const isFeatured = searchParams.get("isFeatured");
      const sort = searchParams.get("sort") || ""; // low-to-high, high-to-low, newest

      // Build filter query
      const filter: any = { isActive: true };

      if (category) {
        filter.category = category;
      }

      if (isFeatured === "true") {
        filter.isFeatured = true;
      } else if (isFeatured === "false") {
        filter.isFeatured = false;
      }

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      // Build sorting options
      let sortOptions: any = { createdAt: -1 }; // Default: newest
      if (sort === "low-to-high") {
        sortOptions = { discountPrice: 1 };
      } else if (sort === "high-to-low") {
        sortOptions = { discountPrice: -1 };
      } else if (sort === "rating") {
        sortOptions = { ratings: -1 };
      }

      // Query database with lean() for fast performance
      const [products, total] = await Promise.all([
        Product.find(filter)
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

  // Get Single Product by slug or id
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

      return NextResponse.json(
        {
          success: true,
          data: product,
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

      // Validate with Zod
      const validation = productUpdateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            message: "Validation failed",
            errors: validation.error.format(),
          },
          { status: 400 }
        );
      }

      // Update fields
      const updateData = validation.data;
      Object.keys(updateData).forEach((key) => {
        if ((updateData as any)[key] !== undefined) {
          (product as any)[key] = (updateData as any)[key];
        }
      });

      // Recalculate slug if title was updated
      if (updateData.title) {
        product.slug = buildProductSlug(product.title, product._id.toString());
      }

      await product.save();

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

      // Soft or hard delete, hard delete is typical here as per previous delete API
      await Product.findByIdAndDelete(product._id);

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
