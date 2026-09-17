import { calculateShipping, FIRST_ORDER_DISCOUNT_RATE } from "./shipping";

/**
 * ──────────────────────────────────────────────────────────────
 * Checkout & Order Calculation Engine — Single Source of Truth
 * ──────────────────────────────────────────────────────────────
 * Provides deterministic, safe, and audited calculations for
 * Cart Subtotal → Discounts → Tax → Shipping → Final Payable Amount.
 */

/** Minimum payable threshold for ecommerce orders (e.g. ₹1 / 100 paise) */
export const MIN_PAYABLE_AMOUNT = 1;

/** Minimum allowed price for any individual cart item */
export const MIN_ITEM_PRICE = 0.01;

/** Default fallback maximum discount cap for percentage coupons without explicit cap */
export const DEFAULT_MAX_PERCENTAGE_DISCOUNT_CAP = 10000;

export interface CartItemLike {
  productId?: string | any;
  quantity: number;
  price: number;
  title?: string;
  size?: string;
  image?: string;
}

export interface CouponLike {
  code: string;
  type?: "percentage" | "flat" | string;
  discount: number;
  maxDiscount?: number | null;
  minOrderAmount?: number | null;
  isActive?: boolean;
  validTill?: Date | string | null;
  usersAvailed?: string[];
}

export interface CheckoutCalculationInput {
  items: CartItemLike[];
  isFirstOrder?: boolean;
  coupon?: CouponLike | null;
  paymentMethod?: "cod" | "online";
  taxRate?: number; // e.g. 0 for GST-inclusive catalog, or 0.18 for 18% explicit
  autoAdjustDiscount?: boolean;
  userClaimKey?: string | null;
}

export interface CheckoutCalculationResult {
  isValid: boolean;
  errors: string[];
  subtotal: number;
  itemCount: number;
  firstOrderDiscount: number;
  couponDiscount: number;
  couponDiscountAdjusted: boolean;
  originalCouponDiscount: number;
  totalDiscount: number;
  tax: number;
  shippingCharge: number;
  isFreeShipping: boolean;
  finalAmount: number;
  amountInPaise: number;
  appliedCouponCode: string | null;
  appliedCouponType: "percentage" | "flat" | null;
  debugSummary: {
    grossBeforeCoupon: number;
    maxAllowedCouponDiscount: number;
    calculationOrder: string;
  };
}

/**
 * Utility to round number to 2 decimal places safely without floating point drift
 */
export function roundToTwoDecimals(value: number): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Defensive validation for cart items
 */
export function validateCartItems(items: CartItemLike[]): {
  valid: boolean;
  errors: string[];
  cleanItems: CartItemLike[];
  subtotal: number;
  itemCount: number;
} {
  const errors: string[] = [];
  let subtotal = 0;
  let itemCount = 0;
  const cleanItems: CartItemLike[] = [];

  if (!Array.isArray(items) || items.length === 0) {
    return {
      valid: false,
      errors: ["Cart is empty. Please add items to proceed."],
      cleanItems: [],
      subtotal: 0,
      itemCount: 0,
    };
  }

  items.forEach((item, index) => {
    const itemNum = index + 1;
    const itemTitle = item.title ? `"${item.title}"` : `Item #${itemNum}`;

    if (!item) {
      errors.push(`${itemTitle}: Invalid item entry.`);
      return;
    }

    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      errors.push(`${itemTitle}: Quantity must be a whole number greater than 0 (received ${item.quantity}).`);
      return;
    }

    const price = Number(item.price);
    if (isNaN(price) || !isFinite(price) || price < MIN_ITEM_PRICE) {
      errors.push(`${itemTitle}: Invalid product price (₹${item.price}). Price must be greater than ₹0.`);
      return;
    }

    const lineTotal = roundToTwoDecimals(price * qty);
    subtotal += lineTotal;
    itemCount += qty;

    cleanItems.push({
      ...item,
      quantity: qty,
      price: roundToTwoDecimals(price),
    });
  });

  subtotal = roundToTwoDecimals(subtotal);

  if (errors.length === 0 && subtotal <= 0) {
    errors.push("Cart subtotal must be greater than zero.");
  }

  return {
    valid: errors.length === 0,
    errors,
    cleanItems,
    subtotal,
    itemCount,
  };
}

/**
 * Validates coupon applicability BEFORE applying discount
 */
export function validateCouponApplicability(
  coupon: CouponLike,
  subtotal: number,
  userClaimKey?: string | null,
): { valid: boolean; message?: string } {
  if (!coupon || !coupon.code) {
    return { valid: false, message: "Invalid coupon code." };
  }

  if (coupon.isActive === false) {
    return { valid: false, message: "This coupon is currently inactive." };
  }

  if (coupon.validTill) {
    const expiry = new Date(coupon.validTill);
    if (!isNaN(expiry.getTime()) && Date.now() > expiry.getTime()) {
      return { valid: false, message: "This coupon has expired." };
    }
  }

  if (userClaimKey && Array.isArray(coupon.usersAvailed) && coupon.usersAvailed.includes(userClaimKey)) {
    return { valid: false, message: "You have already availed this coupon." };
  }

  if (coupon.minOrderAmount && coupon.minOrderAmount > 0) {
    if (subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        message: `This coupon requires a minimum cart value of ₹${coupon.minOrderAmount.toFixed(2)}.`,
      };
    }
  }

  const discountVal = Number(coupon.discount);
  if (isNaN(discountVal) || discountVal <= 0) {
    return { valid: false, message: "Coupon offers an invalid discount amount." };
  }

  if (coupon.type === "percentage" && discountVal > 100) {
    return { valid: false, message: "Percentage discount cannot exceed 100%." };
  }

  return { valid: true };
}

/**
 * Full Pipeline Checkout Calculation
 * Strict Order: Subtotal → Discount → Tax → Shipping → Final Amount (>= MIN_PAYABLE_AMOUNT)
 */
export function calculateCheckout(input: CheckoutCalculationInput): CheckoutCalculationResult {
  const {
    items,
    isFirstOrder = false,
    coupon = null,
    paymentMethod = "cod",
    taxRate = 0,
    autoAdjustDiscount = true,
    userClaimKey = null,
  } = input;

  const itemValidation = validateCartItems(items);
  if (!itemValidation.valid) {
    return {
      isValid: false,
      errors: itemValidation.errors,
      subtotal: 0,
      itemCount: 0,
      firstOrderDiscount: 0,
      couponDiscount: 0,
      couponDiscountAdjusted: false,
      originalCouponDiscount: 0,
      totalDiscount: 0,
      tax: 0,
      shippingCharge: 0,
      isFreeShipping: false,
      finalAmount: 0,
      amountInPaise: 0,
      appliedCouponCode: null,
      appliedCouponType: null,
      debugSummary: {
        grossBeforeCoupon: 0,
        maxAllowedCouponDiscount: 0,
        calculationOrder: "Subtotal → Discount → Tax → Shipping → Final Amount",
      },
    };
  }

  const subtotal = itemValidation.subtotal;
  const errors: string[] = [];

  // Step 1: Shipping charge (calculated on subtotal base)
  const shipping = calculateShipping(subtotal, paymentMethod);
  const shippingCharge = shipping.shippingCharge;
  const isFreeShipping = shipping.isFreeShipping;

  // Step 2: First-Order Discount (if applicable)
  // When a coupon is applied, first-order discount is 0 (or stacked depending on business rule; here coupon overrides first-order)
  let firstOrderDiscount = 0;
  if (isFirstOrder && !coupon) {
    firstOrderDiscount = roundToTwoDecimals(subtotal * FIRST_ORDER_DISCOUNT_RATE);
  }

  // Step 3: Coupon Discount Calculation
  let appliedCouponDiscount = 0;
  let originalCouponDiscount = 0;
  let couponDiscountAdjusted = false;
  let appliedCouponCode: string | null = null;
  let appliedCouponType: "percentage" | "flat" | null = null;

  if (coupon) {
    const couponValidation = validateCouponApplicability(coupon, subtotal, userClaimKey);
    if (!couponValidation.valid) {
      errors.push(couponValidation.message || "Invalid coupon.");
    } else {
      appliedCouponCode = String(coupon.code).toUpperCase();
      const couponType = coupon.type === "percentage" ? "percentage" : "flat";
      appliedCouponType = couponType;

      const discountVal = Number(coupon.discount);
      const discountableBase = Math.max(0, subtotal - firstOrderDiscount);

      if (couponType === "percentage") {
        // Percentage discount
        const rawDiscount = (discountableBase * discountVal) / 100;
        const maxCap =
          typeof coupon.maxDiscount === "number" && coupon.maxDiscount > 0
            ? coupon.maxDiscount
            : DEFAULT_MAX_PERCENTAGE_DISCOUNT_CAP;

        originalCouponDiscount = roundToTwoDecimals(Math.min(rawDiscount, maxCap));
      } else {
        // Flat discount — cannot exceed the discountable subtotal base
        originalCouponDiscount = roundToTwoDecimals(Math.min(discountVal, discountableBase));
      }

      appliedCouponDiscount = originalCouponDiscount;
    }
  }

  // Step 4: Tax Calculation on post-discount merchandise base
  const discountedSubtotal = Math.max(0, subtotal - firstOrderDiscount - appliedCouponDiscount);
  const tax = roundToTwoDecimals(discountedSubtotal * Math.max(0, taxRate));

  // Step 5: Enforce Minimum Payable Threshold Safe Guards
  // Gross total before coupon discount
  const grossBeforeCoupon = roundToTwoDecimals(subtotal - firstOrderDiscount + tax + shippingCharge);

  // Maximum discount that keeps finalAmount >= MIN_PAYABLE_AMOUNT
  const maxAllowedCouponDiscount = Math.max(0, roundToTwoDecimals(grossBeforeCoupon - MIN_PAYABLE_AMOUNT));

  if (appliedCouponDiscount > maxAllowedCouponDiscount) {
    if (autoAdjustDiscount) {
      appliedCouponDiscount = maxAllowedCouponDiscount;
      couponDiscountAdjusted = true;
    } else {
      errors.push(
        `Coupon discount exceeds allowable limit. Final order amount must be at least ₹${MIN_PAYABLE_AMOUNT.toFixed(2)}.`,
      );
    }
  }

  const totalDiscount = roundToTwoDecimals(firstOrderDiscount + appliedCouponDiscount);
  let finalAmount = roundToTwoDecimals(subtotal - totalDiscount + tax + shippingCharge);

  // Hard safety invariant: Final amount must NEVER be 0 or negative
  if (finalAmount < MIN_PAYABLE_AMOUNT) {
    finalAmount = MIN_PAYABLE_AMOUNT;
  }

  const amountInPaise = Math.round(finalAmount * 100);

  return {
    isValid: errors.length === 0,
    errors,
    subtotal,
    itemCount: itemValidation.itemCount,
    firstOrderDiscount,
    couponDiscount: appliedCouponDiscount,
    couponDiscountAdjusted,
    originalCouponDiscount,
    totalDiscount,
    tax,
    shippingCharge,
    isFreeShipping,
    finalAmount,
    amountInPaise,
    appliedCouponCode,
    appliedCouponType,
    debugSummary: {
      grossBeforeCoupon,
      maxAllowedCouponDiscount,
      calculationOrder: "Subtotal → Discounts → Tax → Shipping → Final Amount",
    },
  };
}

/**
 * Structured debug logger for checkout calculations
 */
export function logCheckoutCalculation(tag: string, result: CheckoutCalculationResult, extra?: Record<string, any>) {
  console.log(`[CheckoutCalculation:${tag}]`, {
    timestamp: new Date().toISOString(),
    isValid: result.isValid,
    subtotal: result.subtotal,
    itemCount: result.itemCount,
    firstOrderDiscount: result.firstOrderDiscount,
    couponCode: result.appliedCouponCode,
    couponDiscount: result.couponDiscount,
    couponDiscountAdjusted: result.couponDiscountAdjusted,
    shippingCharge: result.shippingCharge,
    tax: result.tax,
    finalAmount: result.finalAmount,
    amountInPaise: result.amountInPaise,
    errors: result.errors,
    ...(extra || {}),
  });
}
