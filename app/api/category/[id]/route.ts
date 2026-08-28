import { databaseConnection } from "@/config/databseConnection";
import Category from "@/models/category.model";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  try {
    const { id } = await context.params;
    // console.log(id);
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
    const category = await Category.findByIdAndDelete(id);
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
    const { name, isActive } = await request.json();

    if (!id || (!name && typeof isActive !== "boolean")) {
      return NextResponse.json(
        { success: false, message: "Category id and name are required" },
        { status: 400 },
      );
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        ...(name ? { name } : {}),
        ...(typeof isActive === "boolean" ? { isActive } : {}),
      },
      { new: true },
    );

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
