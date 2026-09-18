import { NextRequest } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import { ProductController } from "@/controllers/product.controller";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  await databaseConnection();
  const { id } = await params;
  return ProductController.getOne(request, id);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  await databaseConnection();
  const { id } = await params;
  return ProductController.update(request, id);
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  await databaseConnection();
  const { id } = await params;
  return ProductController.delete(request, id);
}
