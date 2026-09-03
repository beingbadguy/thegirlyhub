import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Cart from "@/models/cart.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import { isProductInStock } from "@/lib/productStock";
import { NextRequest, NextResponse } from "next/server";

type IncomingItem = {
  productId: string;
  quantity?: number;
  size?: string;
};

export async function POST(request: NextRequest) {
  await databaseConnection();

  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "You must log in to merge a cart." },
        { status: 401 },
      );
    }

    const { products } = await request.json();
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ success: true, message: "Nothing to merge." });
    }

    const [user, cart] = await Promise.all([
      User.findById(decoded.userId),
      Cart.findOne({ userId: decoded.userId }),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    let userCart = cart;
    if (!userCart) {
      userCart = new Cart({ userId: decoded.userId, products: [] });
      user.cart.push(userCart._id);
      await user.save();
    }

    for (const item of products as IncomingItem[]) {
      if (!item?.productId) continue;
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct || !isProductInStock(dbProduct)) continue;

      const size = item.size || "";
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const existing = userCart.products.find(
        (p: { productId: { toString(): string }; size?: string }) =>
          p.productId.toString() === String(item.productId) &&
          (p.size || "") === size,
      );

      if (existing) {
        existing.quantity = Math.min(
          dbProduct.countInStock,
          existing.quantity + quantity,
        );
      } else {
        userCart.products.push({
          productId: item.productId,
          quantity: Math.min(dbProduct.countInStock, quantity),
          size,
        });
      }
    }

    await userCart.save();
    const populated = await Cart.findById(userCart._id).populate(
      "products.productId",
    );

    return NextResponse.json({
      success: true,
      cart: populated,
      message: "Cart merged.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Unable to merge cart." },
      { status: 500 },
    );
  }
}
