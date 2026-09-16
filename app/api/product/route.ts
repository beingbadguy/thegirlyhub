import { databaseConnection } from "@/config/databseConnection";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";
import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import cloudinary from "cloudinary";
import { getPagination, paginationResult } from "@/lib/pagination";
import { buildProductSlug } from "@/lib/slug";
import {
  normalizeProductPayload,
  productInputFromFormData,
} from "@/lib/productPayload";
import { productCreateSchema } from "@/lib/validations/product.schema";

function validationErrorResponse(error: {
  issues: { path: PropertyKey[]; message: string }[];
}) {
  const fieldErrors = Object.fromEntries(
    error.issues.map((issue) => [
      issue.path.map(String).join(".") || "product",
      issue.message,
    ]),
  );

  return NextResponse.json(
    {
      success: false,
      message: "Product validation failed",
      errors: fieldErrors,
    },
    { status: 400 },
  );
}

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const { page, limit, skip } = getPagination(request, 12);
    const category = request.nextUrl.searchParams.get("category");
    const query = request.nextUrl.searchParams.get("q")?.trim();
    const minPrice = request.nextUrl.searchParams.get("minPrice");
    const maxPrice = request.nextUrl.searchParams.get("maxPrice");
    const sortParam = request.nextUrl.searchParams.get("sort");
    const featured = request.nextUrl.searchParams.get("featured");

    const filter: any = {};
    if (query) {
      const searchRegex = new RegExp(
        query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }
    if (category) filter.category = category;
    if (featured === "true") filter.isFeatured = true;
    if (minPrice || maxPrice) {
      filter.discountedPrice = {};
      if (minPrice) filter.discountedPrice.$gte = Number(minPrice);
      if (maxPrice) filter.discountedPrice.$lte = Number(maxPrice);
    }

    let sortOption: any = { createdAt: -1 };
    if (sortParam === "priceLowToHigh") {
      sortOption = { discountedPrice: 1 };
    } else if (sortParam === "priceHighToLow") {
      sortOption = { discountedPrice: -1 };
    } else if (sortParam === "ratingHighToLow") {
      sortOption = { ratings: -1 };
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

    return NextResponse.json(
      {
        success: true,
        message: "Products fetched successfully",
        products,
        pagination: paginationResult(page, limit, total),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        message: "Error fetching products",
        success: false,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  await databaseConnection();
  cloudinaryConnection();
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      const body = await request.json();
      const normalized = normalizeProductPayload(body);
      const validation = productCreateSchema.safeParse({
        ...normalized,
        images: normalized.images.length ? normalized.images : body.images,
      });
      if (!validation.success) return validationErrorResponse(validation.error);

      const product = new Product(normalized);
      await product.save();
      if (!product.slug) {
        product.slug = buildProductSlug(
          product.name || product.title || "product",
          product._id.toString(),
        );
        await product.save();
      }
      return NextResponse.json(
        { message: "Product created successfully", success: true, product },
        { status: 201 },
      );
    }
    const formData = await request.formData();
    const formInput = productInputFromFormData(formData);
    const title = (formInput.name || formInput.title) as string;
    const description = (formInput.longDescription ||
      formInput.description ||
      formInput.shortDescription) as string;
    const price = (formInput.price ?? formInput.sellingPrice) as string;
    const category = formInput.category as string;
    const countInStock = (formInput.totalStock ??
      formInput.stock ??
      formInput.countInStock) as string;
    const discountedPrice = (formInput.discountPrice ??
      formInput.discountedPrice ??
      (formInput.price !== undefined ? formInput.sellingPrice : undefined) ??
      formInput.discountedPrice) as string;
    const info = (formInput.info || description) as string;

    const weight =
      formInput.weight !== undefined ? Number(formInput.weight) : undefined;
    const length =
      formInput.length !== undefined ? Number(formInput.length) : undefined;
    const breadth =
      formInput.breadth !== undefined ? Number(formInput.breadth) : undefined;
    const height =
      formInput.height !== undefined ? Number(formInput.height) : undefined;

    // Retrieve files from 'images' or 'image' field(s)
    let imageFiles = formData.getAll("images") as File[];
    if (
      imageFiles.length === 0 ||
      (imageFiles.length === 1 && (imageFiles[0] as any).size === 0)
    ) {
      imageFiles = formData.getAll("image") as File[];
    }
    // Filter out any invalid/empty file entries
    imageFiles = imageFiles.filter(
      (file) => file && typeof file !== "string" && file.size > 0,
    );

    const metadataValidation = productCreateSchema.safeParse({
      ...formInput,
      title,
      description,
      price: Number(price),
      discountPrice: Number(discountedPrice),
      category: String(category || "")
        .trim()
        .toLowerCase(),
      stock: Number(countInStock),
      images: imageFiles.length > 0 ? ["pending-upload"] : [],
      info,
    });
    if (!metadataValidation.success) {
      return validationErrorResponse(metadataValidation.error);
    }

    const discountPercentage =
      ((Number(price) - Number(discountedPrice)) / Number(price)) * 100;

    // Upload all files to Cloudinary
    const uploadPromises = imageFiles.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const base64String = Buffer.from(arrayBuffer).toString("base64");
      const dataURI = `data:${file.type};base64,${base64String}`;
      const uploadResponse = await cloudinary.v2.uploader.upload(dataURI, {
        folder: "basicsproduct",
      });
      return uploadResponse.secure_url;
    });

    const uploadedUrls = await Promise.all(uploadPromises);

    const product = new Product(
      normalizeProductPayload({
        ...formInput,
        title,
        description,
        price,
        image: uploadedUrls[0] || "",
        images: uploadedUrls,
        category,
        countInStock,
        discountedPrice,
        discountPercentage,
        info,
        weight,
        length,
        breadth,
        height,
        status:
          formInput.status ??
          (formInput.isActive === false ? "draft" : "active"),
      }),
    );

    await product.save();

    product.slug = buildProductSlug(title, product._id.toString());
    await product.save();

    return NextResponse.json(
      {
        message: "Product created successfully",
        success: true,
        product: product,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { message: error?.message || "Error creating product", success: false },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  await databaseConnection();
  try {
    const body = await request.json();
    const id = body.id || body._id;
    if (!id) {
      return NextResponse.json(
        { message: "Product id is required", success: false },
        { status: 400 },
      );
    }
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { message: "Product not found", success: false },
        { status: 404 },
      );
    }

    const normalized = normalizeProductPayload(body, product.toObject());
    Object.assign(product, normalized);

    await product.save();
    return NextResponse.json(
      { product, success: true, message: "Product updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error updating product", success: false },
      { status: 500 },
    );
  }
}
