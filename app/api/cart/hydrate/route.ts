import { databaseConnection } from "@/config/databseConnection";
import Product from "@/models/product.model";
import { NextRequest, NextResponse } from "next/server";

type CartLine = {
  productId: string;
  quantity?: number;
  size?: string;
};

export async function POST(request: NextRequest) {
  await databaseConnection();

  try {
    const { products } = await request.json();
    if (!Array.isArray(products)) {
      return NextResponse.json(
        { success: false, message: "Cart items are required." },
        { status: 400 },
      );
    }

    const ids = products
      .map((item: CartLine) => item.productId)
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({
        success: true,
        cart: { products: [] },
      });
    }

    const dbProducts = await Product.find({ _id: { $in: ids } })
      .select(
        "title name price sellingPrice discountedPrice discountPrice image mainImage countInStock stock totalStock isActive slug category",
      )
      .lean();
    const byId = new Map(dbProducts.map((p: any) => [p._id.toString(), p]));

    const hydrated = products
      .map((item: CartLine) => {
        const product = byId.get(String(item.productId));
        if (!product) return null;
        return {
          productId: product,
          quantity: Math.max(1, Number(item.quantity) || 1),
          size: item.size || "",
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      cart: { products: hydrated },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Unable to load cart items." },
      { status: 500 },
    );
  }
}
