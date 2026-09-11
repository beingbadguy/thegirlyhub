import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import { databaseConnection } from "@/config/databseConnection";
import Category from "@/models/category.model";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "cloudinary";
import { getPagination, paginationResult } from "@/lib/pagination";
import Product from "@/models/product.model";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";

export async function POST(request: NextRequest) {
  await databaseConnection();
  cloudinaryConnection();
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const categoryImage = formData.get("image") as File;

    if (!name?.trim() || !categoryImage) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }
    const categoryAlreadyExists = await Category.findOne({ name: name });
    if (categoryAlreadyExists) {
      return NextResponse.json(
        { success: false, message: "Category already exists" },
        { status: 400 },
      );
    }
    // needed to upload file
    const arrayBuffer = await categoryImage.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");
    const dataURI = `data:${categoryImage.type};base64,${base64String}`;

    const categoryImageResponse = await cloudinary.v2.uploader.upload(dataURI, {
      folder: "basicscategory",
    });

    const category = await Category.create({
      name: name,
      categoryImage: categoryImageResponse.secure_url,
    });
    return NextResponse.json(
      {
        success: true,
        message: "Category created successfully",
        category: category,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create category",
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
    const { page, limit, skip } = getPagination(request, 12);
    const isAdmin = (await fetchTokenDetails(request))?.role === "admin";
    const deleted = request.nextUrl.searchParams.get("deleted") === "true";
    const includeProductImages =
      request.nextUrl.searchParams.get("includeProductImages") === "true";

    let filter: Record<string, unknown> = {};
    if (isAdmin) {
      filter = deleted ? { isDeleted: true } : { isDeleted: { $ne: true } };
    } else {
      filter = { isActive: true, isDeleted: { $ne: true } };
    }
    const [categories, total] = await Promise.all([
      Category.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Category.countDocuments(filter),
    ]);
    const categoryNames = categories.map((category) => category.name);
    const productData = await Product.aggregate([
      { $match: { category: { $in: categoryNames } } },
      {
        $project: {
          category: 1,
          image: 1,
        },
      },
      {
        $group: {
          _id: "$category",
          productCount: { $sum: 1 },
          ...(includeProductImages
            ? { productImages: { $push: "$image" } }
            : {}),
        },
      },
    ]);
    const counts = new Map(
      productData.map((item) => [
        item._id,
        {
          productCount: item.productCount,
          productImages: item.productImages,
        },
      ]),
    );
    const categoriesWithCounts = categories.map((category) => ({
      ...category.toObject(),
      productCount: counts.get(category.name)?.productCount || 0,
      ...(includeProductImages
        ? { productImages: counts.get(category.name)?.productImages || [] }
        : {}),
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Categories fetched successfully",
        categories: categoriesWithCounts,
        pagination: paginationResult(page, limit, total),
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get categories",
      },
      {
        status: 500,
      },
    );
  }
}
