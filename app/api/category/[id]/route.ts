import { databaseConnection } from "@/config/databseConnection";
import Category from "@/models/category.model";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";
import { cloudinaryConnection } from "@/config/cloudinaryConnection";
import cloudinary from "cloudinary";
import { verifyAdmin } from "@/lib/adminAuth";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  try {
    const { isAdmin, decoded } = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 401 },
      );
    }

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

    // Permanent deletion is strictly prohibited.
    // Soft delete preserves all original record data and relationships.
    // Deleting a category does not cascade-delete or alter products.
    category.isDeleted = true;
    category.deletedAt = new Date();
    category.deletedBy = decoded?.userId || null;
    await category.save();

    return NextResponse.json(
      {
        success: true,
        message: "Category moved to deleted items successfully",
        category,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error soft-deleting category:", error);
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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  try {
    const { isAdmin, decoded } = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const contentType = request.headers.get("content-type") || "";

    let name: string | undefined;
    let isActive: boolean | undefined;
    let isDeleted: boolean | undefined;
    let categoryImage: File | null = null;
    let directImageUrl: string | undefined;

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

      const rawImg =
        formData.get("image") ||
        formData.get("categoryImage") ||
        formData.get("imageUrl");
      if (rawImg instanceof File && rawImg.size > 0) {
        categoryImage = rawImg;
      } else if (typeof rawImg === "string" && rawImg.trim() !== "") {
        directImageUrl = rawImg.trim();
      }
    } else {
      const body = await request.json();
      name = body.name;
      isActive = body.isActive;
      isDeleted = body.isDeleted;
      directImageUrl = body.categoryImage || body.image || body.imageUrl;
    }

    if (
      !id ||
      (!name &&
        typeof isActive !== "boolean" &&
        typeof isDeleted !== "boolean" &&
        !categoryImage &&
        !directImageUrl)
    ) {
      return NextResponse.json(
        { success: false, message: "Category id, name or status is required" },
        { status: 400 },
      );
    }

    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 },
      );
    }

    const targetName = (name || category.name || "").trim();

    // Restoration conflict check: prevent duplicate category names among active categories
    if (isDeleted === false) {
      const conflictingCategory = await Category.findOne({
        _id: { $ne: category._id },
        name: { $regex: new RegExp(`^${targetName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        isDeleted: { $ne: true },
      });

      if (conflictingCategory) {
        return NextResponse.json(
          {
            success: false,
            message: `An active category named "${targetName}" already exists. Please resolve the name conflict before restoring.`,
          },
          { status: 409 },
        );
      }
    }

    let imageUrl: string | undefined = directImageUrl;
    if (categoryImage && categoryImage.size > 0) {
      cloudinaryConnection();
      const arrayBuffer = await categoryImage.arrayBuffer();
      const base64String = Buffer.from(arrayBuffer).toString("base64");
      const dataURI = `data:${categoryImage.type};base64,${base64String}`;

      const categoryImageResponse = await cloudinary.v2.uploader.upload(dataURI, {
        folder: "girlyhub_categories",
      });
      imageUrl = categoryImageResponse.secure_url;
    }

    const oldName = category.name;

    if (name) category.name = name.trim();
    if (imageUrl) category.categoryImage = imageUrl;
    if (typeof isActive === "boolean") category.isActive = isActive;

    if (isDeleted === false) {
      category.isDeleted = false;
      category.deletedAt = null;
      category.deletedBy = null;
    } else if (isDeleted === true) {
      category.isDeleted = true;
      category.deletedAt = new Date();
      category.deletedBy = decoded?.userId || null;
    }

    await category.save();

    if (name && oldName && oldName !== name) {
      await Product.updateMany({ category: oldName }, { category: name });
    }

    return NextResponse.json(
      {
        success: true,
        message:
          isDeleted === false
            ? "Category restored successfully"
            : "Category updated successfully",
        category,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Failed to update category:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update category" },
      { status: 500 },
    );
  }
}
