import { databaseConnection } from "@/config/databseConnection";
import {
  DEFAULT_MAX_PERCENTAGE_DISCOUNT_CAP,
  MIN_PAYABLE_AMOUNT,
  roundToTwoDecimals,
} from "@/lib/checkoutCalculation";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import Coupon from "@/models/coupon.model";
import Order from "@/models/order.model";
import User from "@/models/user.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await databaseConnection();

  try {
    const { code, totalAmount, email } = await req.json();
    const cleanCode = String(code || "").trim().toUpperCase();
    const numericTotal = Number(totalAmount);

    if (!cleanCode) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid coupon code." },
        { status: 400 },
      );
    }

    if (isNaN(numericTotal) || numericTotal < MIN_PAYABLE_AMOUNT) {
      return NextResponse.json(
        {
          success: false,
          message: `Cart total must be at least ₹${MIN_PAYABLE_AMOUNT.toFixed(2)} to apply a coupon.`,
        },
        { status: 400 },
      );
    }

    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: "Invalid coupon code." },
        { status: 404 },
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { success: false, message: "This coupon is currently inactive." },
        { status: 400 },
      );
    }

    if (coupon.validTill && new Date() > new Date(coupon.validTill)) {
      return NextResponse.json(
        { success: false, message: "This coupon has expired." },
        { status: 400 },
      );
    }

    if (coupon.minOrderAmount && coupon.minOrderAmount > 0 && numericTotal < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `This coupon requires a minimum cart value of ₹${coupon.minOrderAmount.toFixed(2)}.`,
        },
        { status: 400 },
      );
    }

    const decoded = await fetchTokenDetails(req);
    const userClaimKey = (decoded?.userId || (email ? String(email).trim().toLowerCase() : "")).toString();

    if (userClaimKey && coupon.usersAvailed && coupon.usersAvailed.includes(userClaimKey)) {
      return NextResponse.json(
        { success: false, message: "You have already availed this coupon." },
        { status: 400 },
      );
    }

    if (coupon.code === "NEWGIRLY") {
      const previousOrderQuery = decoded?.userId
        ? { userId: decoded.userId }
        : email
          ? { email: String(email).trim().toLowerCase() }
          : null;

      if (previousOrderQuery) {
        const previousOrder = await Order.exists(previousOrderQuery);
        if (previousOrder) {
          return NextResponse.json(
            {
              success: false,
              message:
                "This welcome coupon is available only on your first order.",
            },
            { status: 400 },
          );
        }
      }

      if (decoded?.userId) {
        const customer = await User.findById(decoded.userId).select(
          "firstPurchase",
        );
        if (customer?.firstPurchase) {
          return NextResponse.json(
            {
              success: false,
              message:
                "This welcome coupon is available only on your first order.",
            },
            { status: 400 },
          );
        }
      }
    }

    let discountAmount = 0;
    if (coupon.type === "percentage") {
      const rawPctDiscount = (numericTotal * coupon.discount) / 100;
      const maxCap =
        typeof coupon.maxDiscount === "number" && coupon.maxDiscount > 0
          ? coupon.maxDiscount
          : DEFAULT_MAX_PERCENTAGE_DISCOUNT_CAP;
      discountAmount = roundToTwoDecimals(Math.min(rawPctDiscount, maxCap));
    } else {
      // Flat discount cannot exceed the cart total
      discountAmount = roundToTwoDecimals(Math.min(coupon.discount, numericTotal));
    }

    // Ensure coupon NEVER reduces final total below minimum threshold (₹1.00)
    const maxAllowedDiscount = Math.max(0, roundToTwoDecimals(numericTotal - MIN_PAYABLE_AMOUNT));
    let discountAdjusted = false;

    if (discountAmount > maxAllowedDiscount) {
      discountAmount = maxAllowedDiscount;
      discountAdjusted = true;
    }

    const finalAmount = Math.max(
      MIN_PAYABLE_AMOUNT,
      roundToTwoDecimals(numericTotal - discountAmount),
    );

    console.log("[POST /api/coupon/apply]", {
      code: coupon.code,
      type: coupon.type,
      discountValue: coupon.discount,
      totalAmount: numericTotal,
      discountAmount,
      discountAdjusted,
      finalAmount,
    });

    return NextResponse.json({
      success: true,
      message: discountAdjusted
        ? "Coupon applied! Discount adjusted to maintain minimum order value of ₹1.00."
        : "Coupon applied successfully!",
      discount: discountAmount,
      discountAdjusted,
      finalAmount,
      couponType: coupon.type,
      discountValue: coupon.discount,
      code: coupon.code,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return NextResponse.json(
      { success: false, message: "Error applying coupon" },
      { status: 500 },
    );
  }
}
