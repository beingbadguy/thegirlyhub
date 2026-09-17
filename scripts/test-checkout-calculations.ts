/**
 * ──────────────────────────────────────────────────────────────
 * Comprehensive Checkout Calculation & Safeguards Test Suite
 * ──────────────────────────────────────────────────────────────
 * Tests all edge cases for order totals, discount calculations,
 * coupon validity, defensive item checks, and minimum payable thresholds.
 */

import {
  calculateCheckout,
  validateCartItems,
  validateCouponApplicability,
  MIN_PAYABLE_AMOUNT,
  roundToTwoDecimals,
} from "../lib/checkoutCalculation";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName}`);
    if (failureDetails) console.error(`     Details: ${failureDetails}`);
  }
}

console.log("\n=======================================================");
console.log("   RUNNING CHECKOUT CALCULATION & SAFEGUARD TESTS      ");
console.log("=======================================================\n");

// -------------------------------------------------------------
// TEST SUITE 1: 100% Discount Coupon
// -------------------------------------------------------------
console.log("--- Test Suite 1: 100% Discount Coupon ---");
{
  const items = [{ productId: "p1", title: "Silk Dress", price: 600, quantity: 1 }];
  const coupon100 = {
    code: "FREE100",
    type: "percentage" as const,
    discount: 100,
    isActive: true,
  };

  const result = calculateCheckout({
    items,
    coupon: coupon100,
    autoAdjustDiscount: true,
  });

  assert(result.isValid, "100% coupon calculates successfully without crash");
  assert(
    result.finalAmount >= MIN_PAYABLE_AMOUNT,
    `Final amount is at least ₹${MIN_PAYABLE_AMOUNT} (got ₹${result.finalAmount})`,
  );
  assert(result.finalAmount === 1, `Final amount auto-adjusted exactly to ₹1.00 (got ₹${result.finalAmount})`);
  assert(result.couponDiscountAdjusted === true, "Discount adjustment flag is set to true");
  assert(result.amountInPaise === 100, `Amount in paise is 100 (got ${result.amountInPaise})`);
  assert(result.couponDiscount === 599, `Coupon discount capped at ₹599 (subtotal 600 - 1) (got ₹${result.couponDiscount})`);
}

// -------------------------------------------------------------
// TEST SUITE 2: Coupon Value Greater Than Cart Value
// -------------------------------------------------------------
console.log("\n--- Test Suite 2: Coupon Value > Cart Value ---");
{
  // 2a: Cart with shipping fee
  const items = [{ productId: "p1", title: "Lip Gloss", price: 200, quantity: 1 }];
  const largeCoupon = {
    code: "FLAT500",
    type: "flat" as const,
    discount: 500,
    isActive: true,
  };

  const resultWithShipping = calculateCheckout({
    items,
    coupon: largeCoupon,
    paymentMethod: "cod",
    autoAdjustDiscount: true,
  });

  // Subtotal = 200, Shipping = 49 (since 200 < 499), Merchandise discount = 200, Total = 49
  assert(resultWithShipping.isValid, "Large coupon calculates valid state with shipping");
  assert(resultWithShipping.subtotal === 200, `Subtotal is ₹200 (got ₹${resultWithShipping.subtotal})`);
  assert(resultWithShipping.shippingCharge === 49, `Shipping charge is ₹49 (got ₹${resultWithShipping.shippingCharge})`);
  assert(resultWithShipping.couponDiscount === 200, `Merchandise discount capped at subtotal ₹200 (got ₹${resultWithShipping.couponDiscount})`);
  assert(resultWithShipping.finalAmount === 49, `Final payable is ₹49 (merchandise 0 + shipping 49) (got ₹${resultWithShipping.finalAmount})`);
  assert(resultWithShipping.amountInPaise === 4900, `Amount in paise is 4900 (got ${resultWithShipping.amountInPaise})`);

  // 2b: Free shipping cart where discount exceeds subtotal
  const freeShippingItems = [{ productId: "p2", title: "Perfume", price: 600, quantity: 1 }];
  const couponExceeding = {
    code: "FLAT700",
    type: "flat" as const,
    discount: 700,
    isActive: true,
  };
  const resultFreeShipping = calculateCheckout({
    items: freeShippingItems,
    coupon: couponExceeding,
    autoAdjustDiscount: true,
  });

  assert(resultFreeShipping.isValid, "Large coupon on free shipping cart calculates valid state");
  assert(resultFreeShipping.shippingCharge === 0, "Shipping is ₹0");
  assert(resultFreeShipping.finalAmount === 1, `Final payable is safely ₹1.00 (got ₹${resultFreeShipping.finalAmount})`);
  assert(resultFreeShipping.couponDiscount === 599, `Coupon discount capped at ₹599 (got ₹${resultFreeShipping.couponDiscount})`);
  assert(resultFreeShipping.amountInPaise === 100, `Amount in paise is 100 (got ${resultFreeShipping.amountInPaise})`);
}

// -------------------------------------------------------------
// TEST SUITE 3: Empty Cart
// -------------------------------------------------------------
console.log("\n--- Test Suite 3: Empty Cart ---");
{
  const emptyResult = calculateCheckout({
    items: [],
    autoAdjustDiscount: true,
  });

  assert(!emptyResult.isValid, "Empty cart is marked as invalid");
  assert(emptyResult.errors.length > 0, "Empty cart produces meaningful error message");
  assert(emptyResult.finalAmount === 0, "Empty cart has final amount 0");

  const validation = validateCartItems([]);
  assert(!validation.valid, "validateCartItems rejects empty array");
}

// -------------------------------------------------------------
// TEST SUITE 4: Invalid Coupons (Inactive, Expired, Already Availed, Invalid Type)
// -------------------------------------------------------------
console.log("\n--- Test Suite 4: Invalid Coupons ---");
{
  const items = [{ productId: "p1", title: "Blush", price: 350, quantity: 1 }];

  // 4a: Inactive coupon
  const inactiveCoupon = { code: "INACTIVE10", discount: 10, isActive: false };
  const resInactive = calculateCheckout({ items, coupon: inactiveCoupon });
  assert(!resInactive.isValid, "Inactive coupon is rejected");
  assert(resInactive.errors.some((e) => e.includes("inactive")), "Reports inactive message");

  // 4b: Expired coupon
  const expiredCoupon = {
    code: "EXPIRED10",
    discount: 10,
    isActive: true,
    validTill: new Date("2020-01-01"),
  };
  const resExpired = calculateCheckout({ items, coupon: expiredCoupon });
  assert(!resExpired.isValid, "Expired coupon is rejected");
  assert(resExpired.errors.some((e) => e.includes("expired")), "Reports expired message");

  // 4c: Already availed coupon
  const availedCoupon = {
    code: "AVAILED10",
    discount: 10,
    isActive: true,
    usersAvailed: ["user_123"],
  };
  const resAvailed = calculateCheckout({
    items,
    coupon: availedCoupon,
    userClaimKey: "user_123",
  });
  assert(!resAvailed.isValid, "Already availed coupon is rejected");
  assert(resAvailed.errors.some((e) => e.includes("already availed")), "Reports already availed message");

  // 4d: Coupon requiring minimum cart amount
  const minOrderCoupon = {
    code: "MIN1000",
    discount: 100,
    type: "flat" as const,
    minOrderAmount: 1000,
    isActive: true,
  };
  const resMinOrder = calculateCheckout({ items, coupon: minOrderCoupon });
  assert(!resMinOrder.isValid, "Coupon with unmet minimum order amount is rejected");

  // 4e: Invalid percentage discount > 100
  const invalidPct = {
    code: "OVER100",
    discount: 150,
    type: "percentage" as const,
    isActive: true,
  };
  const resPct = calculateCheckout({ items, coupon: invalidPct });
  assert(!resPct.isValid, "Percentage discount > 100% is rejected");
}

// -------------------------------------------------------------
// TEST SUITE 5: Multiple Items with Mixed Pricing & Precision
// -------------------------------------------------------------
console.log("\n--- Test Suite 5: Multiple Items with Mixed Pricing & Precision ---");
{
  const mixedItems = [
    { productId: "p1", title: "Item 1", price: 19.99, quantity: 3 }, // 59.97
    { productId: "p2", title: "Item 2", price: 149.5, quantity: 2 },  // 299.00
    { productId: "p3", title: "Item 3", price: 499.0, quantity: 1 },  // 499.00
  ];
  // Subtotal = 59.97 + 299.00 + 499.00 = 857.97 (>= 499 -> Free shipping)

  const result = calculateCheckout({
    items: mixedItems,
    coupon: { code: "SAVE20", discount: 20, type: "percentage", isActive: true },
  });

  assert(result.isValid, "Mixed pricing cart calculates successfully");
  assert(result.subtotal === 857.97, `Subtotal is exact ₹857.97 (got ₹${result.subtotal})`);
  assert(result.isFreeShipping === true, "Free shipping applies for subtotal >= ₹499");
  assert(result.shippingCharge === 0, "Shipping charge is ₹0 for free shipping");
  // 20% of 857.97 = 171.594 -> 171.59
  assert(result.couponDiscount === 171.59, `20% discount is ₹171.59 (got ₹${result.couponDiscount})`);
  // Final = 857.97 - 171.59 = 686.38
  assert(result.finalAmount === 686.38, `Final payable is ₹686.38 (got ₹${result.finalAmount})`);
  assert(result.amountInPaise === 68638, `Amount in paise is 68638 (got ${result.amountInPaise})`);
}

// -------------------------------------------------------------
// TEST SUITE 6: Defensive Checks on Invalid Cart Items
// -------------------------------------------------------------
console.log("\n--- Test Suite 6: Defensive Checks on Invalid Cart Items ---");
{
  // 6a: Price = 0
  const zeroPrice = validateCartItems([{ productId: "p1", title: "Freebie", price: 0, quantity: 1 }]);
  assert(!zeroPrice.valid, "Rejects price = 0");

  // 6b: Negative price
  const negPrice = validateCartItems([{ productId: "p1", title: "Negative", price: -50, quantity: 1 }]);
  assert(!negPrice.valid, "Rejects negative price");

  // 6c: Quantity <= 0 or non-integer
  const zeroQty = validateCartItems([{ productId: "p1", title: "Item", price: 100, quantity: 0 }]);
  assert(!zeroQty.valid, "Rejects quantity = 0");

  const floatQty = validateCartItems([{ productId: "p1", title: "Item", price: 100, quantity: 1.5 }]);
  assert(!floatQty.valid, "Rejects non-integer quantity");

  // 6d: NaN price or undefined
  const nanPrice = validateCartItems([{ productId: "p1", title: "Item", price: NaN, quantity: 1 }]);
  assert(!nanPrice.valid, "Rejects NaN price");
}

// -------------------------------------------------------------
// TEST SUITE 7: Strict Invariant - Final Amount is NEVER <= 0
// -------------------------------------------------------------
console.log("\n--- Test Suite 7: Strict Invariant - Final Amount is NEVER <= 0 ---");
{
  const edgeCases = [
    { name: "₹1 item with 100% coupon", price: 1, discount: 100, type: "percentage" },
    { name: "₹10 item with ₹50 flat coupon", price: 10, discount: 50, type: "flat" },
    { name: "₹498 item (with ₹49 shipping = ₹547) with ₹600 coupon", price: 498, discount: 600, type: "flat" },
    { name: "₹1000 item with 99.9% discount", price: 1000, discount: 99.9, type: "percentage" },
  ];

  for (const tc of edgeCases) {
    const res = calculateCheckout({
      items: [{ productId: "p1", title: "Test", price: tc.price, quantity: 1 }],
      coupon: { code: "TEST", discount: tc.discount, type: tc.type as any, isActive: true },
      autoAdjustDiscount: true,
    });

    assert(
      res.isValid && res.finalAmount >= MIN_PAYABLE_AMOUNT && res.amountInPaise >= 100,
      `Invariant preserved for [${tc.name}]: finalAmount=₹${res.finalAmount}, paise=${res.amountInPaise}`,
    );
  }
}

// -------------------------------------------------------------
// TEST SUITE 8: Calculation Order Verification
// -------------------------------------------------------------
console.log("\n--- Test Suite 8: Calculation Order Verification ---");
{
  // Subtotal (500) → First-Order Discount 15% (75) → Post-discount base (425) → Shipping (0 since subtotal 500 >= 499) → Final (425)
  const orderTest = calculateCheckout({
    items: [{ productId: "p1", title: "Jacket", price: 500, quantity: 1 }],
    isFirstOrder: true,
  });

  assert(orderTest.subtotal === 500, "Subtotal calculated first (₹500)");
  assert(orderTest.firstOrderDiscount === 75, "First order discount calculated from subtotal (₹75)");
  assert(orderTest.shippingCharge === 0, "Shipping fee calculated from subtotal (Free >= ₹499)");
  assert(orderTest.finalAmount === 425, "Final amount matches Subtotal - Discount + Tax + Shipping (₹425)");
}

console.log("\n=======================================================");
console.log(`TEST RESULTS: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
console.log("=======================================================\n");

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL CHECKOUT CALCULATION AND VALIDATION TESTS PASSED!\n");
  process.exit(0);
}
