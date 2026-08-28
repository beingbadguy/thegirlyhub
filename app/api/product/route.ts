import { databaseConnection } from "@/config/databseConnection";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";
import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import cloudinary from "cloudinary";
import { getPagination, paginationResult } from "@/lib/pagination";
import { buildProductSlug } from "@/lib/slug";

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const { page, limit, skip } = getPagination(request, 12);
    const category = request.nextUrl.searchParams.get("category");
    const minPrice = request.nextUrl.searchParams.get("minPrice");
    const maxPrice = request.nextUrl.searchParams.get("maxPrice");
    const sortParam = request.nextUrl.searchParams.get("sort");

    const filter: any = {};
    if (category) filter.category = category;
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
      Product.find(filter).sort(sortOption).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Products fetched successfully",
        products,
        pagination: paginationResult(page, limit, total),
      },
      { status: 200 },
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
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const category = formData.get("category") as string;
    const countInStock = formData.get("countInStock") as string;
    const discountedPrice = formData.get("discountedPrice") as string;
    const info = formData.get("info") as string;

    const weight = formData.get("weight") ? Number(formData.get("weight")) : undefined;
    const length = formData.get("length") ? Number(formData.get("length")) : undefined;
    const breadth = formData.get("breadth") ? Number(formData.get("breadth")) : undefined;
    const height = formData.get("height") ? Number(formData.get("height")) : undefined;

    // Retrieve files from 'images' or 'image' field(s)
    let imageFiles = formData.getAll("images") as File[];
    if (imageFiles.length === 0 || (imageFiles.length === 1 && (imageFiles[0] as any).size === 0)) {
      imageFiles = formData.getAll("image") as File[];
    }
    // Filter out any invalid/empty file entries
    imageFiles = imageFiles.filter(
      (file) => file && typeof file !== "string" && file.size > 0
    );

    if (
      !title?.trim() ||
      !description ||
      !price ||
      imageFiles.length === 0 ||
      !category ||
      !countInStock ||
      !discountedPrice ||
      !info?.trim()
    ) {
      return NextResponse.json(
        { message: "All fields are required", sucess: false, success: false },
        { status: 200 },
      );
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

    const product = new Product({
      title,
      description,
      price,
      image: uploadedUrls[0] || "",
      images: uploadedUrls,
      category,
      countInStock,
      discountedPrice,
      discountPercentage,
      isActive: true,
      info,
      weight,
      length,
      breadth,
      height,
    });

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
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error creating product", success: false },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  await databaseConnection();
  try {
    const { id, isActive } = await request.json();
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
    product.isActive = isActive;

    await product.save();
    return NextResponse.json(
      { product, success: true, message: "Product updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error fetching product", success: false },
      { status: 500 },
    );
  }
}
