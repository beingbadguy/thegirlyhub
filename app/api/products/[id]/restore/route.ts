import { NextRequest } from "next/server";
import { databaseConnection } from "@/config/databseConnection";
import { ProductController } from "@/controllers/product.controller";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  await databaseConnection();
  const { id } = await params;
  return ProductController.restore(request, id);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  await databaseConnection();
  const { id } = await params;
  return ProductController.restore(request, id);
}
