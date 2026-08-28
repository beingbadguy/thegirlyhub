import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Cart from "@/models/cart.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import { isProductInStock } from "@/lib/productStock";
import { NextRequest, NextResponse } from "next/server";

type Product = {
  productId: string;
  quantity: number;
};

type CartProduct = Product & { productId: { toString(): string } };

// export async function POST(
//   request: NextRequest,
//   context: { params: { id: string } }
// ) {
//   await databaseConnection();
//   try {
//     const { id } = context.params;
//     const { size } = await request.json();
//     console.log(size);
//     const decoded = await fetchTokenDetails(request);
//     if (!decoded) {
//       return NextResponse.json(
//         { message: "You must log in to add product to cart", success: false },
//         { status: 401 }
//       );
//     }
//     if (!id) {
//       return NextResponse.json(
//         { message: "Product id is required", success: false },
//         { status: 400 }
//       );
//     }
//     const product = await Product.findById(id);
//     if (!product) {
//       return NextResponse.json(
//         { message: "Product not found", success: false },
//         { status: 404 }
//       );
//     }
//     const user = await User.findById(decoded?.userId);
//     const cart = await Cart.findOne({ userId: decoded?.userId });
//     if (!cart) {
//       const newCart = new Cart({
//         userId: decoded?.userId,
//         products: [
//           {
//             productId: id,
//             quantity: 1,
//             size: size || "",
//           },
//         ],
//       });
//       await newCart.save();
//       user.cart.push(newCart._id);
//       await user.save();

//       return NextResponse.json({ message: "Product added to cart" });
//     } else {
//       const productAlreadyExists = cart.products.find((product: Product) => {
//         return product.productId.toString() === id;
//       });

//       if (productAlreadyExists) {
//         productAlreadyExists.quantity++;
//         await cart.save();

//         return NextResponse.json({ message: "Product already in cart" });
//       } else {
//         cart.products.push({ productId: id, quantity: 1 });
//         await cart.save();
//         return NextResponse.json({ message: "Product added to cart" });
//       }
//     }
//   } catch (error) {
//     console.log(error);
//     return NextResponse.json(
//       { message: "Error fetching product", success: false },
//       { status: 500 }
//     );
//   }
// }
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();

  try {
    const { id } = await context.params;
    const { size } = await request.json();

    const decoded = await fetchTokenDetails(request);
    if (!decoded) {
      return NextResponse.json(
        { message: "You must log in to add product to cart", success: false },
        { status: 401 },
      );
    }

    // Run DB queries in parallel
    const [product, user, cart] = await Promise.all([
      Product.findById(id),
      User.findById(decoded.userId),
      Cart.findOne({ userId: decoded.userId }),
    ]);

    if (!id) {
      return NextResponse.json(
        { message: "Product id is required", success: false },
        { status: 400 },
      );
    }

    if (!product) {
      return NextResponse.json(
        { message: "Product not found", success: false },
        { status: 404 },
      );
    }

    if (!isProductInStock(product)) {
      return NextResponse.json(
        {
          message: `"${product.title}" is out of stock and cannot be added to cart.`,
          success: false,
        },
        { status: 400 },
      );
    }

    if (!cart) {
      const newCart = new Cart({
        userId: decoded.userId,
        products: [{ productId: id, quantity: 1, size: size || "" }],
      });
      await Promise.all([
        newCart.save(),
        user.updateOne({ $push: { cart: newCart._id } }),
      ]);

      return NextResponse.json({ message: "Product added to cart" });
    }

    const productAlreadyExists = cart.products.find(
      (p: CartProduct) => p.productId.toString() === id,
    );
    if (productAlreadyExists) {
      if (productAlreadyExists.quantity >= product.countInStock) {
        return NextResponse.json(
          {
            message: `Only ${product.countInStock} unit(s) available for "${product.title}".`,
            success: false,
          },
          { status: 400 },
        );
      }
      productAlreadyExists.quantity++;
    } else {
      cart.products.push({ productId: id, quantity: 1, size: size || "" });
    }

    await cart.save();
    return NextResponse.json({ message: "Product added to cart" });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error fetching product", success: false },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    const { id } = await context.params;
    const { quantity } = await request.json();

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { message: "Quantity must be at least 1", success: false },
        { status: 400 },
      );
    }

    const [cart, dbProduct] = await Promise.all([
      Cart.findOne({ userId: decoded?.userId }),
      Product.findById(id),
    ]);

    if (!cart) {
      return NextResponse.json(
        { message: "Cart not found", success: false, data: [] },
        { status: 404 },
      );
    }

    if (!dbProduct || !isProductInStock(dbProduct)) {
      return NextResponse.json(
        {
          message: "This product is out of stock.",
          success: false,
        },
        { status: 400 },
      );
    }

    if (quantity > dbProduct.countInStock) {
      return NextResponse.json(
        {
          message: `Only ${dbProduct.countInStock} unit(s) available.`,
          success: false,
        },
        { status: 400 },
      );
    }

    const product = cart.products.find((product: Product) => {
      return product.productId.toString() === id;
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found in cart", success: false },
        { status: 404 },
      );
    }

    product.quantity = quantity;
    await cart.save();
    return NextResponse.json({ cart, success: true, message: "Cart updated" });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error fetching cart", success: false },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    const { id } = await context.params;
    const cart = await Cart.findOne({ userId: decoded?.userId });
    if (!cart) {
      return NextResponse.json(
        { message: "Cart not found", success: false, data: [] },
        { status: 404 },
      );
    }
    cart.products = cart.products.filter((product: Product) => {
      return product.productId.toString() !== id;
    });
    await cart.save();
    return NextResponse.json({ cart, success: true, message: "Cart updated" });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error fetching cart", success: false },
      { status: 500 },
    );
  }
}
