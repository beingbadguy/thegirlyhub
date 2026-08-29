// ──────────────────────────────────────────────────────────────
// Shipping calculation utility — single source of truth
// Used by both frontend (cart / checkout) and backend (order API)
// ──────────────────────────────────────────────────────────────

/** Minimum cart subtotal for free shipping */
export const FREE_SHIPPING_THRESHOLD = 499;

/** Flat shipping fee when subtotal is below the threshold */
export const SHIPPING_CHARGE = 49;

/** Extra fee added when payment method is Cash on Delivery */
export const COD_FEE = 40;

/** First‑order discount rate (15 %) */
export const FIRST_ORDER_DISCOUNT_RATE = 0.15;

export interface ShippingResult {
  /** Shipping fee (0 when free shipping applies) */
  shippingCharge: number;
  /** COD surcharge (0 for online payments) */
  codFee: number;
  /** shippingCharge + codFee */
  totalShipping: number;
  /** How much more the customer needs to add for free shipping (0 if already free) */
  remainingForFreeShipping: number;
  /** Whether free shipping threshold is met */
  isFreeShipping: boolean;
  /** Progress towards free shipping (0–100) */
  freeShippingProgress: number;
}

/**
 * Pure function — calculates shipping charges based on cart subtotal
 * and selected payment method.
 *
 * @param subtotal  Sum of (discountedPrice × qty) for all cart items
 * @param paymentMethod  "cod" | "online"
 */
export function calculateShipping(
  subtotal: number,
  paymentMethod: "cod" | "online" = "online",
): ShippingResult {
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shippingCharge = isFreeShipping ? 0 : SHIPPING_CHARGE;
  const codFee = paymentMethod === "cod" ? COD_FEE : 0;
  const remainingForFreeShipping = isFreeShipping
    ? 0
    : Math.max(0, Math.round((FREE_SHIPPING_THRESHOLD - subtotal) * 100) / 100);
  const freeShippingProgress = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100),
  );

  return {
    shippingCharge,
    codFee,
    totalShipping: shippingCharge + codFee,
    remainingForFreeShipping,
    isFreeShipping,
    freeShippingProgress,
  };
}
