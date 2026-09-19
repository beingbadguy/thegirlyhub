import { NextRequest, NextResponse } from "next/server";
import Product from "@/models/product.model";
import ProductLog from "@/models/productLog.model";
import { productCreateSchema, productUpdateSchema } from "@/lib/validations/product.schema";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { generateUniqueSlug, extractIdFromSlug, slugify, buildProductSlug } from "@/lib/slug";
import { normalizeProductPayload, productInputFromFormData } from "@/lib/productPayload";
import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import cloudinary from "cloudinary";
import mongoose from "mongoose";

// Helper to find a product by database ID or Slug
export async function findProductBySlugOrId(identifier: string) {
  if (!identifier) return null;
  const decoded = decodeURIComponent(identifier).trim();

  // 1. Direct MongoDB ID match
  if (mongoose.Types.ObjectId.isValid(decoded)) {
    const byId = await Product.findById(decoded);
    if (byId) return byId;
  }

  // 2. Exact slug match
  const bySlug = await Product.findOne({ slug: decoded.toLowerCase() });
  if (bySlug) return bySlug;

  // 3. ID extracted from slug suffix (e.g., product-name-65f1234567890abcdef12345)
  const idFromSlug = extractIdFromSlug(decoded);
  if (idFromSlug && mongoose.Types.ObjectId.isValid(idFromSlug)) {
    const byPartialId = await Product.findById(idFromSlug);
    if (byPartialId) return byPartialId;
  }

  // 4. Case-insensitive slug / title search
  const baseSlug = decoded.replace(/-[a-f0-9]{4,6}$/i, "");
  const byBaseSlug = await Product.findOne({
    $or: [
      { slug: new RegExp(`^${baseSlug}$`, "i") },
      { title: new RegExp(`^${baseSlug.replace(/-/g, " ")}$`, "i") },
      { name: new RegExp(`^${baseSlug.replace(/-/g, " ")}$`, "i") },
    ],
  });
  return byBaseSlug || null;
}

// Helper to parse either Multipart FormData or JSON request body
async function parseProductRequestData(request: NextRequest): Promise<{
  input: Record<string, any>;
  imageFiles: File[];
  existingImages: string[];
  isMultipart: boolean;
}> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const formInput = productInputFromFormData(formData);

    const existingImages: string[] = [];
    if (formData.has("existingImages")) {
      formData.getAll("existingImages").forEach((item) => {
        if (typeof item === "string" && item.trim()) {
          existingImages.push(item.trim());
        }
      });
    }

    const imageFiles: File[] = [];
    const allImages = [...formData.getAll("images"), ...formData.getAll("image")];
    allImages.forEach((item) => {
      if (item instanceof File && item.size > 0) {
        imageFiles.push(item);
      } else if (typeof item === "string" && item.trim() && !formData.has("existingImages")) {
        existingImages.push(item.trim());
      }
    });

    return {
      input: formInput,
      imageFiles,
      existingImages: Array.from(new Set(existingImages)),
      isMultipart: true,
    };
  }

  // JSON request body
  let body: Record<string, any> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const existingImages = Array.isArray(body.images)
    ? body.images.filter(Boolean).map((img: any) => String(img).trim())
    : body.image
      ? [String(body.image).trim()]
      : body.mainImage
        ? [String(body.mainImage).trim()]
        : [];

  return {
    input: body,
    imageFiles: [],
    existingImages: Array.from(new Set(existingImages.filter(Boolean))),
    isMultipart: false,
  };
}

// Helper to upload images to Cloudinary
async function uploadProductFilesToCloudinary(files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return [];
  cloudinaryConnection();

  const uploadPromises = files.map(async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");
    const dataURI = `data:${file.type || "image/jpeg"};base64,${base64String}`;
    const uploadResponse = await cloudinary.v2.uploader.upload(dataURI, {
      folder: "girlyhub_products",
    });
    return uploadResponse.secure_url;
  });

  return Promise.all(uploadPromises);
}

export class ProductController {
  // Create Product (Admin Only) - Supports both FormData & JSON
  static async create(request: NextRequest) {
    try {
      const decoded = await fetchTokenDetails(request);
      if (!decoded || decoded.role !== "admin") {
        return NextResponse.json(
          { success: false, message: "Unauthorized. Admin privileges required." },
          { status: 401 }
        );
      }

      const { input, imageFiles, existingImages } = await parseProductRequestData(request);

      // Upload newly added files to Cloudinary
      const uploadedUrls = await uploadProductFilesToCloudinary(imageFiles);
      const combinedImages = Array.from(
        new Set([...existingImages, ...uploadedUrls].filter(Boolean))
      );

      // Normalize fields
      const rawPayload = {
        ...input,
        images: combinedImages.length > 0 ? combinedImages : input.images || [],
        mainImage: combinedImages[0] || input.mainImage || input.image || "",
        image: combinedImages[0] || input.mainImage || input.image || "",
      };

      const normalized = normalizeProductPayload(rawPayload);

      // Validate with Zod schema
      const validation = productCreateSchema.safeParse({
        ...normalized,
        images: normalized.images.length > 0 ? normalized.images : ["pending-upload"],
      });

      if (!validation.success) {
        const errorFormatted = validation.error.format();
        const firstErrorMsg =
          validation.error.issues?.[0]?.message || "Product validation failed";
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
      const titleToSlug = validatedData.title || validatedData.name || normalized.name || "Product";

      // Auto-generate unique slug
      const uniqueSlug = validatedData.slug
        ? slugify(validatedData.slug)
        : await generateUniqueSlug(Product, titleToSlug);

      const isPublished =
        validatedData.isActive !== false &&
        validatedData.status !== "draft" &&
        validatedData.status !== "archived";

      // Save new product to MongoDB
      const product = new Product({
        ...normalized,
        ...validatedData,
        title: titleToSlug,
        name: titleToSlug,
        slug: uniqueSlug,
        images: normalized.images,
        mainImage: normalized.mainImage,
        image: normalized.image,
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
          product: product,
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
      const limit = Math.max(1, parseInt(searchParams.get("limit") || "12", 10));
      const skip = (page - 1) * limit;

      const search = (searchParams.get("search") || searchParams.get("q") || "").trim();
      const category = (searchParams.get("category") || "").trim();
      const status = (searchParams.get("status") || "").trim();
      const isFeatured = searchParams.get("isFeatured") || searchParams.get("featured");
      const sort = (searchParams.get("sort") || "newest").trim();
      const minPrice = searchParams.get("minPrice");
      const maxPrice = searchParams.get("maxPrice");
      const includeAll = searchParams.get("all") === "true"; // Admin dashboard requests all=true to see drafts

      // Build filter query
      const filter: any = {};

      if (!includeAll) {
        filter.isActive = { $ne: false };
        if (status && status !== "all") {
          filter.status = status;
        } else {
          filter.status = { $nin: ["draft", "archived"] };
        }
      } else if (status && status !== "all") {
        filter.status = status;
      }

      if (category && category !== "all") {
        filter.category = {
          $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
        };
      }

      if (isFeatured === "true") {
        filter.$or = [{ isFeatured: true }, { status: "featured" }];
      } else if (isFeatured === "false") {
        filter.isFeatured = false;
      }

      if (minPrice || maxPrice) {
        filter.discountedPrice = {};
        if (minPrice) filter.discountedPrice.$gte = Number(minPrice);
        if (maxPrice) filter.discountedPrice.$lte = Number(maxPrice);
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
        sortOptions = { sellingPrice: 1, discountedPrice: 1, discountPrice: 1, price: 1 };
      } else if (sort === "high-to-low" || sort === "priceHighToLow" || sort === "price-high" || sort === "price") {
        sortOptions = { sellingPrice: -1, discountedPrice: -1, discountPrice: -1, price: -1 };
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
            "title name description shortDescription longDescription price costPrice sellingPrice discountedPrice discountPrice discountPercentage image mainImage images category subCategory brand material sizes countInStock stock totalStock lowStockThreshold rating ratings averageRating numReviews totalReviews status isFeatured isNewArrival tags metaTitle metaDescription createdAt updatedAt isActive slug"
          )
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.countDocuments(filter),
      ]);

      // Normalize products for consistent client handling
      const normalizedProducts = products.map((p: any) => {
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
          p.discountedPrice ?? p.discountPrice ?? p.sellingPrice ?? price
        );
        const discountPercentage =
          p.discountPercentage ??
          (price > 0 && price > discountedPrice
            ? Math.round(((price - discountedPrice) / price) * 100)
            : 0);
        const countInStock = Number(
          p.countInStock ?? p.stock ?? p.totalStock ?? 0
        );

        return {
          ...p,
          _id: idStr,
          id: idStr,
          title,
          name: title,
          image,
          mainImage: image,
          images,
          price,
          sellingPrice: discountedPrice,
          discountedPrice,
          discountPrice: discountedPrice,
          discountPercentage,
          material: p.material || "",
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          countInStock: p.status === "out_of_stock" ? 0 : countInStock,
          stock: p.status === "out_of_stock" ? 0 : countInStock,
          totalStock: p.status === "out_of_stock" ? 0 : countInStock,
          status: p.status || (countInStock === 0 ? "out_of_stock" : "active"),
          slug: p.slug || idStr,
          category: p.category || "jewellery",
          isActive:
            p.isActive !== false &&
            p.status !== "draft" &&
            p.status !== "archived",
        };
      });

      return NextResponse.json(
        {
          success: true,
          data: normalizedProducts,
          products: normalizedProducts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          },
          message: "Products fetched successfully",
        },
        {
          status: 200,
          headers: includeAll
            ? {}
            : {
                "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
              },
        }
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

      // Ensure slug exists on legacy records
      if (!product.slug) {
        product.slug = buildProductSlug(product.title || product.name || "product", product._id.toString());
        await product.save();
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
          product: product,
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

  // Update Product (Admin Only) - Supports both FormData & JSON
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

      const { input, imageFiles, existingImages, isMultipart } = await parseProductRequestData(request);

      // Upload any newly attached files to Cloudinary
      const uploadedUrls = await uploadProductFilesToCloudinary(imageFiles);

      // Determine images to persist
      let imagesToSave = product.images || [];
      if (isMultipart || existingImages.length > 0 || uploadedUrls.length > 0 || input.images !== undefined) {
        const combined = Array.from(
          new Set([...existingImages, ...uploadedUrls].filter(Boolean))
        );
        if (combined.length > 0 || isMultipart || input.images !== undefined) {
          imagesToSave = combined;
        }
      }

      // Normalize fields with existing product state
      const rawPayload = {
        ...input,
        images: imagesToSave,
        mainImage: imagesToSave[0] || input.mainImage || product.mainImage || "",
        image: imagesToSave[0] || input.image || product.image || "",
      };

      const normalized = normalizeProductPayload(rawPayload, product.toObject());

      // Validate with Zod
      const validation = productUpdateSchema.safeParse(normalized);
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
      Object.assign(product, normalized);
      Object.keys(updateData).forEach((key) => {
        if ((updateData as any)[key] !== undefined) {
          (product as any)[key] = (updateData as any)[key];
        }
      });

      product.images = imagesToSave;
      product.mainImage = imagesToSave[0] || product.mainImage || "";
      product.image = product.mainImage;
      product.sizes = normalized.sizes || [];
      product.markModified("images");
      product.markModified("sizes");

      // Recalculate slug if title changed or custom slug provided
      if (updateData.title && updateData.title !== product.title) {
        product.slug = await generateUniqueSlug(Product, updateData.title, product._id.toString());
      } else if (updateData.slug && updateData.slug !== product.slug) {
        product.slug = await generateUniqueSlug(Product, updateData.slug, product._id.toString());
      } else if (!product.slug) {
        product.slug = buildProductSlug(product.title || product.name || "product", product._id.toString());
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
          product: product,
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
      const deletedTitle = product.title || product.name || "Product";
      const deletedSlug = product.slug || "";

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
