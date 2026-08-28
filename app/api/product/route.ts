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
    const filter = category ? { category } : {};

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
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
    const image = formData.get("image") as File;
    const category = formData.get("category") as string;
    const countInStock = formData.get("countInStock") as string;
    const discountedPrice = formData.get("discountedPrice") as string;
    const info = formData.get("info") as string;

    if (
      !title?.trim() ||
      !description ||
      !price ||
      !image ||
      !category ||
      !countInStock ||
      !discountedPrice ||
      !info?.trim()
    ) {
      return NextResponse.json(
        { message: "All fields are required", sucess: false },
        { status: 200 },
      );
    }

    const discountPercentage =
      ((Number(price) - Number(discountedPrice)) / Number(price)) * 100;

    // needed to upload file
    const arrayBuffer = await image.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");
    const dataURI = `data:${image.type};base64,${base64String}`;

    const productImageResponse = await cloudinary.v2.uploader.upload(dataURI, {
      folder: "basicsproduct",
    });

    const product = new Product({
      title,
      description,
      price,
      image: productImageResponse.secure_url,
      category,
      countInStock,
      discountedPrice,
      discountPercentage,
      isActive: true,
      info,
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
