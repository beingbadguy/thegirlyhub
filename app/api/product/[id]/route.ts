import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { buildProductSlug, extractIdFromSlug, slugify } from "@/lib/slug";
import Product from "@/models/product.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { message: "Product identifier is required", success: false },
        { status: 400 },
      );
    }

    const product = await findProductBySlugOrId(id);
    if (!product) {
      return NextResponse.json(
        { message: "Product not found", success: false },
        { status: 404 },
      );
    }

    if (!product.slug) {
      product.slug = buildProductSlug(product.title, product._id.toString());
      await product.save();
    }

    return NextResponse.json(
      { product, success: true, message: "Product fetched successfully" },
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role != "admin") {
      return NextResponse.json(
        {
          message: "Unauthorised Access, you must be admin",
          success: false,
        },
        { status: 401 },
      );
    }
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { message: "Product id is required", success: false },
        { status: 400 },
      );
    }
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return NextResponse.json(
        { message: "Product not found", success: false },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { success: true, message: "Product Deleted successfully" },
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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  try {
    const { id } = await context.params;
    const { title, discountedPrice, countInStock } = await request.json();
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
    product.title = title;
    product.discountedPrice = discountedPrice;
    product.countInStock = countInStock;
    product.slug = buildProductSlug(title, product._id.toString());

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
