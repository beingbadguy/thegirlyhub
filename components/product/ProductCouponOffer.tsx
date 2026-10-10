"use client";

import React, { useState } from "react";
import { Tag, Copy, Check, Sparkles, TrendingDown, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";

interface ProductCouponOfferProps {
  sellingPrice: number;
  originalPrice?: number;
  quantity?: number;
  couponCode?: string;
  discountPercent?: number;
  className?: string;
}

/**
 * Professional Promotional Coupon Callout for Product Page
 * Highlights the 15% discount with code 'newgirly' and computes the exact final price.
 */
export default function ProductCouponOffer({
  sellingPrice,
  originalPrice,
  quantity = 1,
  couponCode = "newgirly",
  discountPercent = 15,
  className = "",
}: ProductCouponOfferProps) {
  const [copied, setCopied] = useState(false);

  // Fallback protection for price
  const basePrice = Math.max(0, Number(sellingPrice) || 0);
  const qty = Math.max(1, Number(quantity) || 1);

  // Exact 15% discount calculation
  const discountRate = (Number(discountPercent) || 15) / 100;
  const unitDiscountAmount = Math.round(basePrice * discountRate);
  const unitFinalPrice = Math.max(1, basePrice - unitDiscountAmount);

  const totalDiscountAmount = unitDiscountAmount * qty;
  const totalFinalPrice = unitFinalPrice * qty;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(couponCode.toLowerCase());
    }

    // Remember coupon for checkout
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem("girlyhub_applied_coupon", couponCode.toUpperCase());
    }

    setCopied(true);

    // Delightful micro-confetti burst
    try {
      confetti({
        particleCount: 28,
        spread: 55,
        origin: { y: 0.8 },
        colors: ["#db4d79", "#f43f5e", "#fb7185", "#10b981", "#f59e0b"],
        disableForReducedMotion: true,
      });
    } catch {
      // Ignore if confetti unavailable
    }

    setTimeout(() => {
      setCopied(false);
    }, 2800);
  };

  if (basePrice <= 0) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/95 via-pink-50/50 to-amber-50/35 p-3.5 sm:p-4 shadow-xs transition-all hover:border-rose-300 ${className}`}
    >
      {/* Soft luxury ambient background glow */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-200/40 blur-xl" />

      {/* Header Row: Badge & Offer Tag */}
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-2xs">
            <Sparkles className="h-3 w-3 text-rose-100" />
            Special Offer
          </span>
          <span className="text-xs font-semibold text-rose-950/80 hidden xs:inline">
            Exclusive Deal
          </span>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
          <TrendingDown className="h-3 w-3 text-emerald-600" />
          Extra {discountPercent}% OFF
        </span>
      </div>

      {/* Main Final Price Showcase */}
      <div className="relative mt-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Final Price with code <span className="font-mono text-rose-700 lowercase font-bold">{couponCode}</span>:
            </p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-rose-600">
                ₹{unitFinalPrice.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-neutral-400 line-through">
                ₹{basePrice.toLocaleString()}
              </span>
              <span className="rounded-md border border-rose-200/80 bg-rose-100/90 px-2 py-0.5 text-[11px] font-extrabold text-rose-800">
                Save ₹{unitDiscountAmount.toLocaleString()} ({discountPercent}% OFF)
              </span>
            </div>
          </div>
        </div>

        <p className="mt-1.5 text-xs text-neutral-700 leading-relaxed">
          Get this product for just{" "}
          <strong className="font-extrabold text-neutral-950">₹{unitFinalPrice.toLocaleString()}</strong>{" "}
          by applying promo code{" "}
          <strong className="font-mono font-bold text-rose-700 lowercase">{couponCode}</strong>{" "}
          at checkout!
        </p>

        {/* Dynamic Quantity Breakdown if qty > 1 */}
        {qty > 1 && (
          <div className="mt-2.5 flex items-center justify-between rounded-xl border border-rose-100 bg-white/80 px-3 py-2 text-xs">
            <span className="font-medium text-neutral-600">
              Total for {qty} items with code:
            </span>
            <div className="text-right">
              <span className="font-extrabold text-neutral-950">
                ₹{totalFinalPrice.toLocaleString()}
              </span>{" "}
              <span className="font-semibold text-emerald-700">
                (You save ₹{totalDiscountAmount.toLocaleString()})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Voucher Code Strip & Interactive Copy Action */}
      <div className="relative mt-3 flex items-center justify-between gap-2 rounded-xl border border-dashed border-rose-300 bg-white/95 px-3 py-2 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-rose-100/80 text-rose-600 shrink-0">
            <Tag className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block leading-none">
              Coupon Code
            </span>
            <span className="font-mono text-sm sm:text-base font-black tracking-wider text-rose-700 uppercase">
              {couponCode}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy coupon code"
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs ${
            copied
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-rose-600 text-white hover:bg-rose-700"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Reassurance Footer */}
      <div className="relative mt-2.5 flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        <span>
          Enter code <strong className="text-neutral-800 lowercase">{couponCode}</strong> on the checkout page to get this discounted price.
        </span>
      </div>
    </div>
  );
}
