import { databaseConnection } from "@/config/databseConnection";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { getPagination, paginationResult } from "@/lib/pagination";
import { validateOrderInput } from "@/lib/orderValidation";
import { calculateShipping, FIRST_ORDER_DISCOUNT_RATE } from "@/lib/shipping";
import Cart from "@/models/cart.model";
import Coupon from "@/models/coupon.model";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";
import {
  OrderConfirmationMail,
  orderPlacedMessageToAdmin,
} from "@/services/sendMail";
import { after, NextRequest, NextResponse } from "next/server";

const AMOUNT_TOLERANCE = 2;

export async function POST(request: NextRequest) {
  await databaseConnection();

  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded) {
      return NextResponse.json(
        { message: "You must log in to place an order", success: false },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validation = validateOrderInput(body);

    if (!validation.valid) {
      return NextResponse.json(
        {
          message: validation.errors[0],
          errors: validation.errors,
          success: false,
        },
        { status: 400 },
      );
    }

    const {
      totalAmount,
      paymentMethod,
      deliveryType,
      recipientName,
      email,
      address,
      city,
      state,
      landmark,
      orderNotes,
      phone,
      products,
      zip,
      couponCode,
    } = body;

    const userId = decoded.userId.toString();
    const [user, cart, dbProducts] = await Promise.all([
      User.findOne({ _id: decoded.userId }),
      Cart.findOne({ userId }),
      Product.find({
        _id: { $in: products.map((item: { productId: string }) => item.productId) },
      }),
    ]);

    if (!user) {
      return NextResponse.json(
        { message: "User account not found", success: false },
        { status: 404 },
      );
    }

    if (!cart || !cart.products?.length) {
      return NextResponse.json(
        { message: "Your cart is empty. Add items before placing an order.", success: false },
        { status: 400 },
      );
    }

    const productsById = new Map(
      dbProducts.map((product) => [product._id.toString(), product]),
    );

    let subtotal = 0;
    const verifiedProducts = [];

    for (const item of products) {
      const dbProduct = productsById.get(String(item.productId));
      if (!dbProduct) {
        return NextResponse.json(
          { message: `"${item.title}" is no longer available.`, success: false },
          { status: 400 },
        );
      }
      if (!dbProduct.isActive) {
        return NextResponse.json(
          { message: `"${dbProduct.title}" is currently unavailable.`, success: false },
          { status: 400 },
        );
      }
      if (dbProduct.countInStock < item.quantity) {
        return NextResponse.json(
          {
            message: `Only ${dbProduct.countInStock} unit(s) left for "${dbProduct.title}".`,
            success: false,
          },
          { status: 400 },
        );
      }

      subtotal += dbProduct.discountedPrice * item.quantity;

      verifiedProducts.push({
        productId: dbProduct._id,
        quantity: item.quantity,
        title: dbProduct.title,
        price: dbProduct.discountedPrice,
        image: dbProduct.image,
        size: item.size || "",
      });
    }

    const shipping = calculateShipping(subtotal, paymentMethod);
    const shippingCharge = shipping.shippingCharge;
    const codFee = shipping.codFee;
    const firstTimeDiscount = user.firstPurchase
      ? 0
      : (subtotal + shippingCharge) * FIRST_ORDER_DISCOUNT_RATE;
    let expectedTotal = Math.max(
      0,
      Math.round((subtotal + shippingCharge + codFee - firstTimeDiscount) * 100) / 100,
    );

    // Track coupon discount separately so it can be stored on the order
    let appliedCouponDiscount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: String(couponCode).toUpperCase(),
      });
      if (!coupon) {
        return NextResponse.json(
          { message: "Invalid coupon code.", success: false },
          { status: 400 },
        );
      }
      if (!coupon.isActive) {
        return NextResponse.json(
          { message: "This coupon is currently inactive.", success: false },
          { status: 400 },
        );
      }
      if (coupon.validTill && new Date() > new Date(coupon.validTill)) {
        return NextResponse.json(
          { message: "This coupon has expired.", success: false },
          { status: 400 },
        );
      }
      if (coupon.usersAvailed && coupon.usersAvailed.includes(userId)) {
        return NextResponse.json(
          { message: "You have already availed this coupon.", success: false },
          { status: 400 },
        );
      }
      if (coupon.type === "percentage") {
        appliedCouponDiscount = Math.round(((expectedTotal * coupon.discount) / 100) * 100) / 100;
      } else {
        appliedCouponDiscount = coupon.discount;
      }
      expectedTotal = Math.max(
        0,
        Math.round((expectedTotal - appliedCouponDiscount) * 100) / 100,
      );
    }

    if (Math.abs(totalAmount - expectedTotal) > AMOUNT_TOLERANCE) {
      return NextResponse.json(
        {
          message: "Order total mismatch. Please refresh checkout and try again.",
          success: false,
        },
        { status: 400 },
      );
    }

    const newOrder = new Order({
      userId: decoded.userId,
      totalAmount: expectedTotal,
      subtotal,
      shippingCharge,
      codFee,
      firstOrderDiscount: Math.round(firstTimeDiscount * 100) / 100,
      couponDiscount: appliedCouponDiscount,
      paymentMethod,
      deliveryType: deliveryType || "normal",
      recipientName: recipientName.trim(),
      email: email?.trim() || user.email,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      landmark: landmark?.trim() || null,
      orderNotes: orderNotes?.trim() || null,
      phone: Number(phone),
      products: verifiedProducts,
      zip: Number(zip),
      couponCode: couponCode || null,
      status: "processing",
    });

    await newOrder.save();

    if (couponCode) {
      await Coupon.findOneAndUpdate(
        { code: String(couponCode).toUpperCase() },
        { $addToSet: { usersAvailed: userId } }
      );
    }

    user.order.push(newOrder._id);
    if (user.firstPurchase === false) user.firstPurchase = true;
    user.cart = [];
    user.address = address.trim();
    user.city = city.trim();
    user.state = state.trim();
    user.landmark = landmark?.trim() || null;
    user.zip = Number(zip);
    user.phone = Number(phone);
    user.updatedAt = new Date();

    await Promise.all([
      ...verifiedProducts.map((item) =>
        Product.findByIdAndUpdate(item.productId, {
          $inc: { sold: item.quantity, countInStock: -item.quantity },
        }),
      ),
      Cart.findOneAndDelete({ userId }),
      user.save(),
    ]);

    const orderId = newOrder._id.toString();
    const mailPayload = {
      _id: orderId,
      totalAmount: newOrder.totalAmount,
      address: `${newOrder.address}, ${newOrder.city}, ${newOrder.state} - ${newOrder.zip}`,
      paymentMethod: newOrder.paymentMethod,
      deliveryType: newOrder.deliveryType,
      products: verifiedProducts,
    };
    const customerEmail = user.email;
    const customerName = user.name || recipientName;

    after(async () => {
      try {
        await Promise.all([
          OrderConfirmationMail(customerEmail, customerName, mailPayload),
          orderPlacedMessageToAdmin(customerEmail, customerName),
        ]);
      } catch (mailError) {
        console.error("Order confirmation email failed:", mailError);
      }
    });

    return NextResponse.json(
      { message: "Order placed successfully", success: true, order: { _id: orderId } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error placing order:", error);
    const message =
      error instanceof Error && error.name === "ValidationError"
        ? "Invalid order details. Please check your information and try again."
        : "Unable to place order. Please try again.";
    return NextResponse.json({ message, success: false }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  await databaseConnection();
  try {
    const decoded = await fetchTokenDetails(request);
    if (!decoded) {
      return NextResponse.json(
        { message: "You must log in to view your orders", success: false },
        { status: 401 },
      );
    }

    const { page, limit, skip } = getPagination(request);
    const [orders, total] = await Promise.all([
      Order.find({ userId: decoded?.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "userId", select: "-password -pass" })
        .populate({ path: "products.productId" }),
      Order.countDocuments({ userId: decoded?.userId }),
    ]);

    return NextResponse.json(
      {
        orders,
        success: true,
        message: "Orders fetched successfully",
        pagination: paginationResult(page, limit, total),
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { message: "Error fetching orders", success: false },
      { status: 500 },
    );
  }
}
