import { FIRST_ORDER_DISCOUNT_RATE, calculateShipping } from "@/lib/shipping";
import {
  OrderInput,
  validateOrderInput,
} from "@/lib/orderValidation";
import Coupon from "@/models/coupon.model";
import Order from "@/models/order.model";
import Product from "@/models/product.model";
import User from "@/models/user.model";

export type PreparedCheckout = {
  user: any | null;
  userId: string | null;
  isGuest: boolean;
  couponClaimKey: string;
  subtotal: number;
  shippingCharge: number;
  firstTimeDiscount: number;
  appliedCouponDiscount: number;
  expectedTotal: number;
  expectedAmountInPaise: number;
  verifiedProducts: {
    productId: any;
    quantity: number;
    title: string;
    price: number;
    image: string;
    size: string;
  }[];
  recipientName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  landmark: string | null;
  orderNotes: string | null;
  phone: number;
  zip: number;
  couponCode: string | null;
  paymentMethod: "cod" | "online";
  deliveryType: "normal" | "fast";
};

export type PrepareCheckoutResult =
  | { ok: true; data: PreparedCheckout }
  | { ok: false; status: number; message: string; errors?: string[] };

export async function prepareCheckout(
  body: Partial<OrderInput>,
  decodedUserId?: string | null,
): Promise<PrepareCheckoutResult> {
  const isGuest = !decodedUserId;
  const validationBody = { ...body };

  if (isGuest && !String(body.email || "").trim()) {
    return {
      ok: false,
      status: 400,
      message: "Email is required for guest checkout.",
    };
  }

  const validation = validateOrderInput(validationBody);
  if (!validation.valid) {
    return {
      ok: false,
      status: 400,
      message: validation.errors[0],
      errors: validation.errors,
    };
  }

  const {
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
  } = body as OrderInput;

  let user = null;
  if (decodedUserId) {
    user = await User.findById(decodedUserId);
    if (!user) {
      return { ok: false, status: 404, message: "User account not found" };
    }
  }

  const dbProducts = await Product.find({
    _id: { $in: products.map((item) => item.productId) },
  });
  const productsById = new Map(
    dbProducts.map((product) => [product._id.toString(), product]),
  );

  let subtotal = 0;
  const verifiedProducts = [];

  for (const item of products) {
    const dbProduct = productsById.get(String(item.productId));
    if (!dbProduct) {
      return {
        ok: false,
        status: 400,
        message: `"${item.title}" is no longer available.`,
      };
    }
    if (!dbProduct.isActive) {
      return {
        ok: false,
        status: 400,
        message: `"${dbProduct.title}" is currently unavailable.`,
      };
    }
    if (dbProduct.countInStock < item.quantity) {
      return {
        ok: false,
        status: 400,
        message: `Only ${dbProduct.countInStock} unit(s) left for "${dbProduct.title}".`,
      };
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

  const checkoutEmail = String(email || user?.email || "")
    .trim()
    .toLowerCase();
  if (!checkoutEmail) {
    return {
      ok: false,
      status: 400,
      message: "Email is required to place an order.",
    };
  }

  let alreadyPurchased = Boolean(user?.firstPurchase);
  if (!alreadyPurchased) {
    const previousOrder = await Order.exists({
      email: checkoutEmail,
      status: { $ne: "cancelled" },
    });
    alreadyPurchased = Boolean(previousOrder);
  }

  const shipping = calculateShipping(subtotal, paymentMethod);
  const shippingCharge = shipping.shippingCharge;
  const firstTimeDiscount = alreadyPurchased
    ? 0
    : (subtotal + shippingCharge) * FIRST_ORDER_DISCOUNT_RATE;

  let expectedTotal = Math.max(
    0,
    Math.round((subtotal + shippingCharge - firstTimeDiscount) * 100) / 100,
  );
  let appliedCouponDiscount = 0;
  const normalizedCoupon = couponCode
    ? String(couponCode).toUpperCase()
    : null;
  const couponClaimKey = (decodedUserId || checkoutEmail).toString();

  if (normalizedCoupon) {
    const coupon = await Coupon.findOne({ code: normalizedCoupon });
    if (!coupon) {
      return { ok: false, status: 400, message: "Invalid coupon code." };
    }
    if (!coupon.isActive) {
      return {
        ok: false,
        status: 400,
        message: "This coupon is currently inactive.",
      };
    }
    if (coupon.validTill && new Date() > new Date(coupon.validTill)) {
      return { ok: false, status: 400, message: "This coupon has expired." };
    }
    if (
      coupon.usersAvailed &&
      coupon.usersAvailed.includes(couponClaimKey)
    ) {
      return {
        ok: false,
        status: 400,
        message: "You have already availed this coupon.",
      };
    }
    appliedCouponDiscount =
      coupon.type === "percentage"
        ? Math.round(((expectedTotal * coupon.discount) / 100) * 100) / 100
        : coupon.discount;
    expectedTotal = Math.max(
      0,
      Math.round((expectedTotal - appliedCouponDiscount) * 100) / 100,
    );
  }

  if (expectedTotal <= 0) {
    return {
      ok: false,
      status: 400,
      message: "Order total must be greater than zero.",
    };
  }

  return {
    ok: true,
    data: {
      user,
      userId: decodedUserId || null,
      isGuest,
      couponClaimKey,
      subtotal,
      shippingCharge,
      firstTimeDiscount: Math.round(firstTimeDiscount * 100) / 100,
      appliedCouponDiscount,
      expectedTotal,
      expectedAmountInPaise: Math.round(expectedTotal * 100),
      verifiedProducts,
      recipientName: recipientName.trim(),
      email: checkoutEmail,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      landmark: landmark?.trim() || null,
      orderNotes: orderNotes?.trim() || null,
      phone: Number(phone),
      zip: Number(zip),
      couponCode: normalizedCoupon,
      paymentMethod,
      deliveryType: deliveryType || "normal",
    },
  };
}
