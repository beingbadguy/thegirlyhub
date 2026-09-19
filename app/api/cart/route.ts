import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Cart from "@/models/cart.model";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded) {
      return NextResponse.json(
        { message: "You must log in to view your cart", success: false },
        { status: 401 }
      );
    }
    const cart = await Cart.findOne({ userId: decoded.userId })
      .select("userId products createdAt")
      .populate({
        path: "products.productId",
        model: Product,
        strictPopulate: false,
        select:
          "title name price sellingPrice discountedPrice discountPrice image mainImage countInStock stock totalStock isActive slug category sizes",
      })
      .lean();

    if (!cart) {
      return NextResponse.json(
        { message: "Cart not found", success: true, cart: { products: [] } },
        {
          status: 200,
          headers: {
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
          },
        },
      );
    }
    return NextResponse.json(
      { cart, success: true },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { message: "Error fetching cart", success: false },
      { status: 500 },
    );
  }
}
