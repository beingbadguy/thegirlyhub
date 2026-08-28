import { NextRequest } from "next/server";
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
