import { NextRequest, NextResponse } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import { ProductController } from "@/controllers/product.controller";

export async function GET(request: NextRequest) {
  await databaseConnection();
  return ProductController.getAll(request);
}

export async function POST(request: NextRequest) {
  await databaseConnection();
  return ProductController.create(request);
}

export async function PUT(request: NextRequest) {
  await databaseConnection();
  try {
    const contentType = request.headers.get("content-type") || "";
    let id = "";

    if (contentType.includes("multipart/form-data")) {
      // Clone request to read formData for identifier without consuming stream if needed
      const cloned = request.clone();
      const formData = await cloned.formData();
      id = (formData.get("id") || formData.get("_id")) as string;
    } else {
      const cloned = request.clone();
      const body = await cloned.json().catch(() => ({}));
      id = body.id || body._id;
    }

    if (!id) {
      return NextResponse.json(
        { message: "Product ID or slug is required for update", success: false },
        { status: 400 }
      );
    }

    return ProductController.update(request, id);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Failed to update product", success: false },
      { status: 500 }
    );
  }
}
