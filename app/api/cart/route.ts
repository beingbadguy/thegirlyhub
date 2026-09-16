import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Cart from "@/models/cart.model";
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
    const cart = await Cart.findOne({ userId: decoded?.userId })
      .populate({
        path: "products.productId",
        select:
          "title name price sellingPrice discountedPrice discountPrice image mainImage countInStock stock totalStock isActive slug",
      })
      .lean();
    if (!cart) {
      return NextResponse.json(
        { message: "Cart not found", success: false, data: [] },
        { status: 200 }
      );
    }
    return NextResponse.json({ cart, success: true });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error fetching cart", success: false },
      { status: 500 }
    );
  }
}
