"use client";

import Link from "next/link";
import React from "react";
import { Truck, ShieldCheck, Sprout, Heart, ArrowRight } from "lucide-react";

/**
 * Detailed Satin Pink Ribbon Bow SVG
 */
function RibbonBow({ className = "w-20 h-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bowGradLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE1E6" />
          <stop offset="45%" stopColor="#EDB0BD" />
          <stop offset="100%" stopColor="#D98191" />
        </linearGradient>
        <linearGradient id="bowGradRight" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE6EA" />
          <stop offset="50%" stopColor="#EEB3BF" />
          <stop offset="100%" stopColor="#DA8494" />
        </linearGradient>
        <linearGradient id="bowGradKnot" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE4E8" />
          <stop offset="40%" stopColor="#EB9FAB" />
          <stop offset="100%" stopColor="#C86A7C" />
        </linearGradient>
        <filter id="bowShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#C67C87" floodOpacity="0.28" />
        </filter>
      </defs>

      <g filter="url(#bowShadow)">
        {/* Left Flowing Tail */}
        <path
          d="M 52 42 C 45 54, 30 68, 18 84 C 27 80, 37 74, 44 78 C 50 66, 55 54, 58 44 Z"
          fill="url(#bowGradLeft)"
        />
        {/* Right Flowing Tail */}
        <path
          d="M 68 42 C 75 54, 90 68, 102 84 C 93 80, 83 74, 76 78 C 70 66, 65 54, 62 44 Z"
          fill="url(#bowGradRight)"
        />

        {/* Left Loop Shadow & Depth */}
        <path
          d="M 56 38 C 38 20, 14 20, 20 40 C 25 52, 48 45, 56 40 Z"
          fill="#C46E80"
          opacity="0.32"
        />
        {/* Left Main Loop */}
        <path
          d="M 58 36 C 40 14, 10 16, 14 38 C 18 55, 48 47, 58 40 Z"
          fill="url(#bowGradLeft)"
        />
        {/* Left Loop Highlight Sheen */}
        <path
          d="M 26 30 C 32 24, 45 26, 54 35 C 45 37, 34 35, 26 30 Z"
          fill="#FFF0F3"
          opacity="0.75"
        />

        {/* Right Loop Shadow & Depth */}
        <path
          d="M 64 38 C 82 20, 106 20, 100 40 C 95 52, 72 45, 64 40 Z"
          fill="#C46E80"
          opacity="0.32"
        />
        {/* Right Main Loop */}
        <path
          d="M 62 36 C 80 14, 110 16, 106 38 C 102 55, 72 47, 62 40 Z"
          fill="url(#bowGradRight)"
        />
        {/* Right Loop Highlight Sheen */}
        <path
          d="M 94 30 C 88 24, 75 26, 66 35 C 75 37, 86 35, 94 30 Z"
          fill="#FFF0F3"
          opacity="0.75"
        />

        {/* Center Ribbon Knot */}
        <ellipse cx="60" cy="38" rx="8" ry="9" fill="url(#bowGradKnot)" />
        <ellipse cx="58.5" cy="35" rx="3.5" ry="4" fill="#FFFFFF" opacity="0.6" />
      </g>
    </svg>
  );
}

export default function NotFoundPage() {
  return (
    <main className="min-h-[90vh] bg-[#FCFAF8] text-[#252B37] flex flex-col justify-between items-center px-4 sm:px-6 lg:px-12 pt-6 sm:pt-10 pb-8 relative overflow-hidden selection:bg-[#F9D6DC] selection:text-[#9A4657]">
      {/* Subtle Background Radial Ambient Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[500px] rounded-full pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(253, 230, 235, 0.45) 0%, rgba(252, 250, 248, 0) 70%)",
        }}
        aria-hidden="true"
      />

      {/* Main Hero Center Container */}
      <div className="max-w-6xl w-full mx-auto flex flex-col items-center justify-center relative my-auto py-8 sm:py-12">
        {/* DESKTOP DECORATION: Left Floating Cursive Note & Soft Ribbon Curve */}
        <div className="hidden lg:flex flex-col items-start absolute left-0 xl:left-4 top-1/2 -translate-y-1/2 pointer-events-none select-none z-0">
          {/* Cursive handwritten note */}
          <div
            className="text-[#4A5568] text-2xl xl:text-3xl leading-snug rotate-[-3deg] text-left pl-6"
            style={{
              fontFamily: "var(--font-caveat), 'Caveat', cursive",
            }}
          >
            <p>Still</p>
            <p>so many</p>
            <p>pretty things</p>
            <p>to see</p>
            <p className="text-xl xl:text-2xl mt-1 text-[#D48B95]">♡</p>
          </div>

          {/* Graceful Wavy Pink Ribbon Swoosh Path */}
          <svg
            className="w-48 xl:w-60 h-28 -mt-4 -ml-8 opacity-75"
            viewBox="0 0 200 90"
            fill="none"
          >
            <path
              d="M 0 35 C 50 35, 45 80, 105 80 C 160 80, 150 45, 200 45"
              stroke="#F4C6CF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* DESKTOP DECORATION: Right Floating Ribbon Bow & Cursive Note */}
        <div className="hidden lg:flex flex-col items-center absolute right-0 xl:right-4 top-1/2 -translate-y-1/2 pointer-events-none select-none z-0">
          {/* Satin Bow on the right */}
          <RibbonBow className="w-20 h-16 xl:w-24 xl:h-20 rotate-[12deg] mb-1 drop-shadow-sm" />

          {/* Cursive handwritten note */}
          <div
            className="text-[#4A5568] text-2xl xl:text-3xl leading-snug rotate-[2deg] text-center"
            style={{
              fontFamily: "var(--font-caveat), 'Caveat', cursive",
            }}
          >
            <p>Good</p>
            <p>things</p>
            <p>always</p>
            <p>find you</p>
            <p className="text-xl xl:text-2xl mt-1 text-[#D48B95]">♡</p>
          </div>
        </div>

        {/* Central 404 Feature Group */}
        <div className="relative inline-block select-none my-1 sm:my-2 z-10">
          {/* Ribbon Bow centered right on top of the "0" */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-8 sm:-top-12 md:-top-14 z-20 pointer-events-none">
            <RibbonBow className="w-18 h-14 sm:w-24 sm:h-18 md:w-28 md:h-22" />
          </div>

          {/* Large 404 Numerals */}
          <h1
            className="text-[#D48B95] tracking-tight font-normal leading-none"
            style={{
              fontSize: "clamp(120px, 19vw, 235px)",
              fontFamily:
                "var(--font-playfair), var(--font-bodoni-moda), 'Playfair Display', serif",
            }}
          >
            404
          </h1>

          {/* Outlined Cute Heart near the second 4 */}
          <span
            className="absolute right-[-14px] sm:right-[-26px] md:right-[-38px] top-6 sm:top-10 md:top-12 text-[#D48B95] text-3xl sm:text-4xl md:text-5xl select-none"
            style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive" }}
            aria-hidden="true"
          >
            ♡
          </span>
        </div>

        {/* Heading: Page Not Found */}
        <h2
          className="text-[#252B37] text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight mt-3 mb-3 sm:mb-4 text-center z-10"
          style={{
            fontFamily:
              "var(--font-playfair), var(--font-bodoni-moda), 'Playfair Display', serif",
          }}
        >
          Page Not Found
        </h2>

        {/* Subtitle Message */}
        <p
          className="text-[#64748B] text-sm sm:text-base md:text-lg max-w-lg mx-auto text-center leading-relaxed px-4 mb-8 sm:mb-10 z-10 font-normal"
          style={{ fontFamily: "var(--font-poppins), sans-serif" }}
        >
          Oops! The page you’re looking for seems to have wandered off.
          <br className="hidden sm:inline" /> Let’s get you back to something beautiful.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4 sm:gap-5 z-10">
          {/* Primary Pill Button: Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 sm:px-10 sm:py-4 rounded-full text-white bg-[#C47B85] hover:bg-[#B36873] active:scale-95 transition-all duration-300 font-medium text-sm sm:text-base shadow-sm hover:shadow-md hover:shadow-rose-300/40"
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
          >
            <span>Back to Home</span>
            <ArrowRight size={18} className="stroke-[2.2]" />
          </Link>

          {/* Secondary Underlined Link: Explore Our Collection */}
          <Link
            href="/categories"
            className="inline-block text-[#252B37] hover:text-[#C47B85] underline underline-offset-4 decoration-1 hover:decoration-2 text-sm sm:text-base font-medium transition-colors"
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
          >
            Explore Our Collection
          </Link>
        </div>

        {/* MOBILE / TABLET FRIENDLY: Decorative Cursive Notes in Compact Row */}
        <div
          className="flex lg:hidden justify-center items-center gap-8 sm:gap-16 mt-8 sm:mt-10 text-[#556070] text-xl sm:text-2xl select-none"
          style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive" }}
        >
          <div className="text-center rotate-[-2deg]">
            <p>Still so many pretty things to see ♡</p>
          </div>
          <div className="text-center rotate-[2deg] hidden xs:block">
            <p>Good things always find you ♡</p>
          </div>
        </div>
      </div>

      {/* Bottom Features / Trust Proposition Bar */}
      <footer className="w-full max-w-6xl mx-auto pt-8 sm:pt-10 mt-6 sm:mt-8 border-t border-[#EFE5E1] z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFE5E1]">
          {/* 1. Free Shipping */}
          <div className="flex items-center justify-center sm:justify-start gap-3.5 px-2 sm:px-4 pt-3 sm:pt-0">
            <div className="text-[#C47B85] flex-shrink-0">
              <Truck size={26} className="stroke-[1.6]" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm sm:text-[15px] text-[#1F242E] leading-tight">
                Free Shipping
              </h3>
              <p className="text-xs sm:text-[13px] text-[#788292] leading-tight mt-0.5">
                on orders above ₹399
              </p>
            </div>
          </div>

          {/* 2. Secure Payments */}
          <div className="flex items-center justify-center sm:justify-start gap-3.5 px-2 sm:px-4 pt-4 sm:pt-0">
            <div className="text-[#C47B85] flex-shrink-0">
              <ShieldCheck size={26} className="stroke-[1.6]" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm sm:text-[15px] text-[#1F242E] leading-tight">
                Secure Payments
              </h3>
              <p className="text-xs sm:text-[13px] text-[#788292] leading-tight mt-0.5">
                100% safe & trusted
              </p>
            </div>
          </div>

          {/* 3. Trendy Accessories */}
          <div className="flex items-center justify-center sm:justify-start gap-3.5 px-2 sm:px-4 pt-4 sm:pt-0">
            <div className="text-[#C47B85] flex-shrink-0">
              <Sprout size={26} className="stroke-[1.6]" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm sm:text-[15px] text-[#1F242E] leading-tight">
                Trendy Accessories
              </h3>
              <p className="text-xs sm:text-[13px] text-[#788292] leading-tight mt-0.5">
                For Every You
              </p>
            </div>
          </div>

          {/* 4. Loved by 10K+ Girls */}
          <div className="flex items-center justify-center sm:justify-start gap-3.5 px-2 sm:px-4 pt-4 sm:pt-0">
            <div className="text-[#C47B85] flex-shrink-0">
              <Heart size={26} className="stroke-[1.6]" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-sm sm:text-[15px] text-[#1F242E] leading-tight">
                Loved by 10K+ Girls
              </h3>
              <p className="text-xs sm:text-[13px] text-[#788292] leading-tight mt-0.5">
                Across India
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
