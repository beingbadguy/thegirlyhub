"use client";

import Link from "next/link";
import React from "react";
import { ArrowRight, Truck, ShieldCheck, Heart, Sparkles } from "lucide-react";

/**
 * Delicate Satin Pink Ribbon Bow SVG
 */
function RibbonBow({ className = "w-12 h-9" }: { className?: string }) {
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
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#C67C87" floodOpacity="0.22" />
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

const POPULAR_COLLECTIONS = [
  { name: "Korean Earrings", href: "/category/Korean%20Earrings" },
  { name: "Hair Claws", href: "/category/Hair%20Claws" },
  { name: "Jhumkas", href: "/category/Jhumkas" },
  { name: "Bracelets", href: "/category/Bracelets" },
  { name: "Pendants", href: "/category/Pendants" },
];

export default function NotFoundPage() {
  return (
    <main className="min-h-[75vh] bg-[#FCFAF8] text-[#252B37] flex flex-col justify-between items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative overflow-hidden selection:bg-[#F9D6DC] selection:text-[#9A4657]">
      {/* Soft Ambient Background Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] sm:w-[640px] h-[360px] rounded-full pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(253, 230, 235, 0.4) 0%, rgba(252, 250, 248, 0) 70%)",
        }}
        aria-hidden="true"
      />

      {/* Main Content Card */}
      <div className="max-w-2xl w-full mx-auto flex flex-col items-center justify-center text-center relative z-10 my-auto py-4 sm:py-6">
        {/* Subtle Decorative Bow Accent */}
        <div className="mb-3 flex justify-center">
          <RibbonBow className="w-11 h-8 sm:w-13 sm:h-9 drop-shadow-xs" />
        </div>

        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-[#FDF0F3] text-[#B85869] border border-[#FAD3DC] shadow-2xs mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D47486]" />
          <span>Error 404 • Page Not Found</span>
        </div>

        {/* Clean Typographic 404 Number (Balanced Size) */}
        <h1
          className="text-[#D48B95] tracking-tight font-normal leading-none my-1 select-none text-5xl sm:text-6xl md:text-7xl"
          style={{
            fontFamily:
              "var(--font-playfair), var(--font-bodoni-moda), 'Playfair Display', serif",
          }}
        >
          404
        </h1>

        {/* Editorial Headline */}
        <h2
          className="text-[#1F242E] text-2xl sm:text-3xl md:text-[34px] font-normal tracking-tight mt-2 mb-2"
          style={{
            fontFamily:
              "var(--font-playfair), var(--font-bodoni-moda), 'Playfair Display', serif",
          }}
        >
          Lost in the Sparkle?
        </h2>

        {/* Refined Descriptive Subtitle */}
        <p
          className="text-[#64748B] text-xs sm:text-sm md:text-[15px] max-w-md mx-auto leading-relaxed px-2 mb-6 font-normal"
          style={{ fontFamily: "var(--font-poppins), sans-serif" }}
        >
          The page or piece you’re looking for seems to have wandered off.
          Let’s get you back to discovering something beautiful.
        </p>

        {/* Action Buttons (Proportional and sleek) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
          {/* Primary Pill Button */}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:px-7 sm:py-3 rounded-full text-white bg-[#C47B85] hover:bg-[#B36873] active:scale-95 transition-all duration-300 font-medium text-xs sm:text-sm shadow-sm hover:shadow-md hover:shadow-rose-300/40"
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
          >
            <span>Back to Home</span>
            <ArrowRight size={15} className="stroke-[2.2]" />
          </Link>

          {/* Secondary Pill Button */}
          <Link
            href="/categories"
            className="inline-flex items-center justify-center rounded-full border border-[#E5CDD3] bg-white hover:bg-rose-50/50 hover:border-[#D9BDC4] px-6 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-sm font-medium text-[#252B37] active:scale-95 transition-all duration-300 shadow-2xs"
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
          >
            Explore Collections
          </Link>
        </div>

        {/* Quick Collection Discovery Chips */}
        <div className="w-full pt-4 border-t border-[#F2E8E6]">
          <p
            className="text-[11px] sm:text-xs font-medium text-[#7C889B] uppercase tracking-wider mb-3"
            style={{ fontFamily: "var(--font-poppins), sans-serif" }}
          >
            Popular Categories
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {POPULAR_COLLECTIONS.map((col) => (
              <Link
                key={col.name}
                href={col.href}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-[#4A5568] border border-[#EADBDE] hover:border-[#C47B85] hover:text-[#C47B85] hover:bg-[#FFF8F9] transition-all shadow-2xs"
                style={{ fontFamily: "var(--font-poppins), sans-serif" }}
              >
                {col.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Minimalist Trust / Proposition Strip */}
      <footer className="w-full max-w-4xl mx-auto pt-6 mt-6 border-t border-[#F0E6E3] z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
          {/* 1. Free Delivery */}
          <div className="flex items-center justify-center sm:justify-start gap-2.5 px-2">
            <div className="text-[#C47B85] flex-shrink-0">
              <Truck size={18} className="stroke-[1.75]" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-[#1F242E] leading-tight">
                Free Delivery
              </h3>
              <p className="text-[11px] text-[#788292] leading-tight mt-0.5">
                Across India
              </p>
            </div>
          </div>

          {/* 2. Secure Payments */}
          <div className="flex items-center justify-center sm:justify-start gap-2.5 px-2">
            <div className="text-[#C47B85] flex-shrink-0">
              <ShieldCheck size={18} className="stroke-[1.75]" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-[#1F242E] leading-tight">
                Safe & Secure
              </h3>
              <p className="text-[11px] text-[#788292] leading-tight mt-0.5">
                Trusted checkout
              </p>
            </div>
          </div>

          {/* 3. Handpicked Pieces */}
          <div className="flex items-center justify-center sm:justify-start gap-2.5 px-2">
            <div className="text-[#C47B85] flex-shrink-0">
              <Sparkles size={18} className="stroke-[1.75]" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-[#1F242E] leading-tight">
                Trendy Designs
              </h3>
              <p className="text-[11px] text-[#788292] leading-tight mt-0.5">
                Curated for you
              </p>
            </div>
          </div>

          {/* 4. Loved by 10K+ Girls */}
          <div className="flex items-center justify-center sm:justify-start gap-2.5 px-2">
            <div className="text-[#C47B85] flex-shrink-0">
              <Heart size={18} className="stroke-[1.75]" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-[#1F242E] leading-tight">
                Loved by 10K+
              </h3>
              <p className="text-[11px] text-[#788292] leading-tight mt-0.5">
                Happy shoppers
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
