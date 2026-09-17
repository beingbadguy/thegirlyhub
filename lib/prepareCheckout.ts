import {
  calculateCheckout,
  logCheckoutCalculation,
  MIN_PAYABLE_AMOUNT,
  CouponLike,
} from "@/lib/checkoutCalculation";
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

  let user: any = null;
  if (decodedUserId) {
    user = (await User.findById(decodedUserId).select("_id name email firstPurchase").lean()) as any;
    if (!user) {
      return { ok: false, status: 404, message: "User account not found" };
    }
  }

  const dbProducts = await Product.find({
    _id: { $in: products.map((item) => item.productId) },
  })
    .select(
      "title name price sellingPrice discountedPrice discountPrice image mainImage countInStock stock totalStock isActive",
    )
    .lean();
  const productsById = new Map(
    dbProducts.map((product: any) => [product._id.toString(), product]),
  );

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

    const productPrice = Number(
      dbProduct.discountedPrice ||
        (dbProduct as any).sellingPrice ||
        dbProduct.price ||
        (dbProduct as any).discountPrice ||
        item.price ||
        0,
    );

    if (productPrice <= 0) {
      return {
        ok: false,
        status: 400,
        message: `Invalid price for product "${dbProduct.title}".`,
      };
    }

    verifiedProducts.push({
      productId: dbProduct._id,
      quantity: Number(item.quantity),
      title: dbProduct.title || (dbProduct as any).name || item.title || "Product",
      price: productPrice,
      image: dbProduct.image || (dbProduct as any).mainImage || item.image || "",
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

  const couponClaimKey = (decodedUserId || checkoutEmail).toString();
  const normalizedCoupon = couponCode ? String(couponCode).trim().toUpperCase() : null;
  let dbCoupon: CouponLike | null = null;

  if (normalizedCoupon) {
    const foundCoupon = await Coupon.findOne({ code: normalizedCoupon }).lean();
    if (!foundCoupon) {
      return { ok: false, status: 400, message: "Invalid coupon code." };
    }
    dbCoupon = foundCoupon as unknown as CouponLike;
  }

  // Execute pipeline through Checkout Calculation Engine
  const calcResult = calculateCheckout({
    items: verifiedProducts,
    isFirstOrder: !alreadyPurchased,
    coupon: dbCoupon,
    paymentMethod,
    autoAdjustDiscount: true,
    userClaimKey: couponClaimKey,
  });

  if (!calcResult.isValid) {
    return {
      ok: false,
      status: 400,
      message: calcResult.errors[0] || "Invalid order calculation.",
      errors: calcResult.errors,
    };
  }

  if (calcResult.finalAmount < MIN_PAYABLE_AMOUNT) {
    return {
      ok: false,
      status: 400,
      message: `Order total must be at least ₹${MIN_PAYABLE_AMOUNT.toFixed(2)}.`,
    };
  }

  logCheckoutCalculation("prepareCheckout", calcResult, {
    email: checkoutEmail,
    userId: decodedUserId || null,
    isGuest,
  });

  return {
    ok: true,
    data: {
      user,
      userId: decodedUserId || null,
      isGuest,
      couponClaimKey,
      subtotal: calcResult.subtotal,
      shippingCharge: calcResult.shippingCharge,
      firstTimeDiscount: calcResult.firstOrderDiscount,
      appliedCouponDiscount: calcResult.couponDiscount,
      expectedTotal: calcResult.finalAmount,
      expectedAmountInPaise: calcResult.amountInPaise,
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
