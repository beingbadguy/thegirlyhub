import { databaseConnection } from "@/config/databseConnection";
import Category from "@/models/category.model";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";
import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import cloudinary from "cloudinary";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Category id is required",
        },
        {
          status: 400,
        },
      );
    }

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        {
          status: 404,
        },
      );
    }

    // Check if category has active products
    const productsCount = await Product.countDocuments({ category: category.name });
    if (productsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete category because it contains active products.",
        },
        {
          status: 400,
        },
      );
    }

    // Soft delete
    category.isDeleted = true;
    await category.save();

    return NextResponse.json(
      {
        success: true,
        message: "Category deleted successfully",
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
        message: "Failed to delete category",
      },
      {
        status: 500,
      },
    );
  }
}

// FIXME: single category update
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  try {
    const { id } = await context.params;
    const contentType = request.headers.get("content-type") || "";

    let name: string | undefined;
    let isActive: boolean | undefined;
    let isDeleted: boolean | undefined;
    let categoryImage: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      name = formData.get("name") as string;

      const isActiveStr = formData.get("isActive") as string;
      if (isActiveStr !== null && isActiveStr !== undefined) {
        isActive = isActiveStr === "true";
      }

      const isDeletedStr = formData.get("isDeleted") as string;
      if (isDeletedStr !== null && isDeletedStr !== undefined) {
        isDeleted = isDeletedStr === "true";
      }

      categoryImage = formData.get("image") as File;
    } else {
      const body = await request.json();
      name = body.name;
      isActive = body.isActive;
      isDeleted = body.isDeleted;
    }

    if (!id || (!name && typeof isActive !== "boolean" && typeof isDeleted !== "boolean" && !categoryImage)) {
      return NextResponse.json(
        { success: false, message: "Category id, name or status is required" },
        { status: 400 },
      );
    }

    let imageUrl: string | undefined;
    if (categoryImage && categoryImage.size > 0) {
      cloudinaryConnection();
      const arrayBuffer = await categoryImage.arrayBuffer();
      const base64String = Buffer.from(arrayBuffer).toString("base64");
      const dataURI = `data:${categoryImage.type};base64,${base64String}`;

      const categoryImageResponse = await cloudinary.v2.uploader.upload(dataURI, {
        folder: "basicscategory",
      });
      imageUrl = categoryImageResponse.secure_url;
    }

    const oldCategory = await Category.findById(id);
    const oldName = oldCategory?.name;

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        ...(name ? { name } : {}),
        ...(imageUrl ? { categoryImage: imageUrl } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        ...(typeof isDeleted === "boolean" ? { isDeleted } : {}),
      },
      { new: true },
    );

    if (name && oldName && oldName !== name) {
      await Product.updateMany({ category: oldName }, { category: name });
    }

    if (!updatedCategory) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Category updated successfully",
        category: updatedCategory,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: "Failed to update category" },
      { status: 500 },
    );
  }
}
