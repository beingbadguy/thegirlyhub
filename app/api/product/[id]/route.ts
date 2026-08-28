import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { buildProductSlug, extractIdFromSlug, slugify } from "@/lib/slug";
import Product from "@/models/product.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import cloudinary from "cloudinary";

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
  cloudinaryConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorised Access, you must be admin", success: false },
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

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { message: "Product not found", success: false },
        { status: 404 },
      );
    }

    const contentType = request.headers.get("content-type") || "";
    let title = product.title;
    let description = product.description;
    let price = product.price;
    let category = product.category;
    let countInStock = product.countInStock;
    let discountedPrice = product.discountedPrice;
    let info = product.info;
    let weight = product.weight;
    let imagesToSave = product.images;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      title = (formData.get("title") as string) || title;
      description = (formData.get("description") as string) || description;
      price = formData.get("price") ? Number(formData.get("price")) : price;
      category = (formData.get("category") as string) || category;
      countInStock = formData.get("countInStock") ? Number(formData.get("countInStock")) : countInStock;
      discountedPrice = formData.get("discountedPrice") ? Number(formData.get("discountedPrice")) : discountedPrice;
      info = (formData.get("info") as string) || info;
      weight = formData.get("weight") ? Number(formData.get("weight")) : weight;

      // Extract new image files and existing image URLs
      const imagesField = formData.getAll("images");
      const imageFiles: File[] = [];
      const existingUrls: string[] = [];

      imagesField.forEach((item) => {
        if (item instanceof File) {
          if (item.size > 0) {
            imageFiles.push(item);
          }
        } else if (typeof item === "string" && item.trim() !== "") {
          existingUrls.push(item);
        }
      });

      const imageSingleField = formData.getAll("image");
      imageSingleField.forEach((item) => {
        if (item instanceof File) {
          if (item.size > 0) {
            imageFiles.push(item);
          }
        } else if (typeof item === "string" && item.trim() !== "") {
          existingUrls.push(item);
        }
      });

      const existingImagesField = formData.getAll("existingImages");
      existingImagesField.forEach((item) => {
        if (typeof item === "string" && item.trim() !== "") {
          existingUrls.push(item);
        }
      });

      // Upload new files
      const uploadPromises = imageFiles.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const base64String = Buffer.from(arrayBuffer).toString("base64");
        const dataURI = `data:${file.type};base64,${base64String}`;
        const uploadResponse = await cloudinary.v2.uploader.upload(dataURI, {
          folder: "basicsproduct",
        });
        return uploadResponse.secure_url;
      });

      const newUploadedUrls = await Promise.all(uploadPromises);

      // Merge existing and new URLs
      const finalImages = [...existingUrls, ...newUploadedUrls];
      
      const hasImageFields =
        formData.has("images") || formData.has("image") || formData.has("existingImages");
      
      if (hasImageFields) {
        imagesToSave = finalImages;
      }
    } else {
      const body = await request.json();
      title = body.title !== undefined ? body.title : title;
      description = body.description !== undefined ? body.description : description;
      price = body.price !== undefined ? Number(body.price) : price;
      category = body.category !== undefined ? body.category : category;
      countInStock = body.countInStock !== undefined ? Number(body.countInStock) : countInStock;
      discountedPrice = body.discountedPrice !== undefined ? Number(body.discountedPrice) : discountedPrice;
      info = body.info !== undefined ? body.info : info;
      weight = body.weight !== undefined ? Number(body.weight) : weight;

      if (Array.isArray(body.images)) {
        imagesToSave = body.images;
      } else if (body.image !== undefined) {
        imagesToSave = [body.image];
      }
    }

    const discountPercentage =
      ((Number(price) - Number(discountedPrice)) / Number(price)) * 100;

    // Apply values to product model (updating both legacy and new properties to sync correctly)
    product.title = title;
    product.description = description;
    product.price = price;
    product.category = category;
    product.countInStock = countInStock;
    product.stock = countInStock;
    product.discountedPrice = discountedPrice;
    product.discountPrice = discountedPrice;
    product.discountPercentage = discountPercentage;
    product.info = info;
    product.weight = weight;
    product.images = imagesToSave;

    product.slug = buildProductSlug(title, product._id.toString());

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
