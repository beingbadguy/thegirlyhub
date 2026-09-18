"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FloralAccent from "@/components/decorations/FloralAccent";

interface CategoryEmptyStateProps {
  categoryName?: string;
}

export default function CategoryEmptyState({
  categoryName = "this category",
}: CategoryEmptyStateProps) {
  return (
    <div className="relative mx-auto my-2 sm:my-3 w-full max-w-2xl sm:max-w-3xl overflow-hidden rounded-[24px] sm:rounded-[32px] border border-[#F6DCE2] bg-[#FFFAF9] px-5 py-7 sm:px-10 sm:py-9 text-center shadow-[0_6px_25px_rgba(240,180,195,0.1)]">
      {/* Corner Floral Accents */}
      <div className="pointer-events-none absolute -top-4 -left-4 opacity-50 sm:opacity-75">
        <FloralAccent flower={1} size="md" variant="float" className="-rotate-12" />
      </div>
      <div className="pointer-events-none absolute -bottom-5 -right-5 opacity-50 sm:opacity-75">
        <FloralAccent flower={2} size="md" variant="float-delayed" className="rotate-12" />
      </div>

      {/* Decorative Shopping Bag Illustration */}
      <div className="relative inline-block my-0 sm:my-1">
        {/* Top-Right Cursive Note: "Kuch aur dekho?" */}
        <div className="absolute -top-5 -right-12 sm:-right-18 flex flex-col items-start select-none pointer-events-none">
          <span
            className="text-[#6E4F58] text-lg sm:text-xl leading-none rotate-[6deg]"
            style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive" }}
          >
            Kuch aur dekho?
          </span>
          <svg className="w-9 h-4 -mt-0.5 -ml-1 text-[#ECAFB9]" viewBox="0 0 50 25" fill="none">
            <path d="M4 18 C 14 4, 28 24, 44 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </div>

        {/* Radiating Action Sparks above-left */}
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 absolute -top-1 -left-3 sm:-left-4 text-[#2D3748] opacity-85 select-none pointer-events-none"
          viewBox="0 0 30 30"
          fill="none"
        >
          <path d="M 12 18 L 4 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 18 12 L 15 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 8 8 L 2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>

        {/* Cute Outlined Heart to right of bag */}
        <span
          className="absolute -right-5 sm:-right-7 top-1/2 -translate-y-1/2 text-[#D28D97] text-xl sm:text-2xl select-none pointer-events-none"
          style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive" }}
        >
          ♡
        </span>

        {/* Shopping Bag Vector Graphic */}
        <svg
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-24 h-24 sm:w-28 sm:h-28 md:w-30 md:h-30 mx-auto drop-shadow-sm"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bagFrontGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2F5" />
              <stop offset="100%" stopColor="#F9D8E0" />
            </linearGradient>
            <linearGradient id="bagSideGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F7D4DC" />
              <stop offset="100%" stopColor="#EDB4C2" />
            </linearGradient>
            <radialGradient id="shadowPuddleGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#EBC7D0" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#FFFAF9" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Shadow Puddle */}
          <ellipse cx="80" cy="144" rx="54" ry="9" fill="url(#shadowPuddleGrad)" />

          {/* Bag Handles */}
          <path
            d="M 64 62 C 64 36, 96 36, 96 62"
            stroke="#3D222A"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Left Side Panel */}
          <path
            d="M 48 62 L 64 60 L 54 138 L 40 136 Z"
            fill="url(#bagSideGrad)"
            stroke="#38222A"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Front Panel */}
          <path
            d="M 64 60 L 112 60 L 124 138 L 54 138 Z"
            fill="url(#bagFrontGrad)"
            stroke="#38222A"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Heart Emblem on Front of Bag */}
          <path
            d="M 88 94 C 88 86, 76 86, 76 96 C 76 104, 88 113, 88 113 C 88 113, 100 104, 100 96 C 100 86, 88 86, 88 94 Z"
            fill="#D47486"
          />
        </svg>
      </div>

      {/* Category Tag Header */}
      <p
        className="mt-1.5 text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] text-[#C47B85] uppercase select-none"
        style={{ fontFamily: "var(--font-poppins), sans-serif" }}
      >
        Category Collection
      </p>

      {/* Main Headline: "No products in {categoryName}" */}
      <h2
        className="mt-1 text-2xl sm:text-3xl md:text-[34px] font-normal text-[#1F242E] tracking-tight leading-snug"
        style={{
          fontFamily:
            "var(--font-playfair), var(--font-bodoni-moda), 'Playfair Display', serif",
        }}
      >
        No products in <span className="capitalize">{categoryName}</span>
      </h2>

      {/* Explanatory Subtext */}
      <p
        className="mt-1.5 text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed"
        style={{ fontFamily: "var(--font-poppins), sans-serif" }}
      >
        We couldn’t find any matching pieces in this category yet.
        <br className="hidden sm:inline" /> But don’t worry, there’s so much more to explore!{" "}
        <span
          className="text-[#D47486] text-sm sm:text-base inline-block align-middle ml-0.5"
          style={{ fontFamily: "var(--font-caveat), cursive" }}
        >
          ♡
        </span>
      </p>

      {/* Action Buttons */}
      <div className="mt-5 sm:mt-6 flex flex-wrap items-center justify-center gap-3 z-10 relative">
        {/* Pill Button 1: All Products */}
        <Link
          href="/product"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C47B85] hover:bg-[#B36873] px-6 py-2.5 sm:px-7 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-sm hover:shadow-md hover:shadow-rose-300/40 active:scale-95 transition-all duration-300"
          style={{ fontFamily: "var(--font-poppins), sans-serif" }}
        >
          <span>All Products</span>
          <ArrowRight size={14} className="stroke-[2.2]" />
        </Link>

        {/* Pill Button 2: Browse Categories */}
        <Link
          href="/category"
          className="inline-flex items-center justify-center rounded-full border border-[#E5CDD3] bg-white hover:bg-rose-50/50 hover:border-[#D9BDC4] px-6 py-2.5 sm:px-7 sm:py-2.5 text-xs sm:text-sm font-medium text-[#252B37] active:scale-95 transition-all duration-300"
          style={{ fontFamily: "var(--font-poppins), sans-serif" }}
        >
          Browse Categories
        </Link>
      </div>

      {/* Bottom-Left Decorative Element: Flowing Ribbon Heart */}
      <div className="absolute left-2 sm:left-4 bottom-2 sm:bottom-3 pointer-events-none select-none opacity-80">
        <svg className="w-18 sm:w-22 h-14 text-[#F2BAC5]" viewBox="0 0 100 65" fill="none">
          <path
            d="M 0 52 C 24 52, 20 34, 34 25 C 40 18, 52 20, 46 32 C 40 40, 30 48, 30 48 C 30 48, 20 40, 20 31 C 20 21, 30 18, 34 25"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {/* Bottom-Right Decorative Element: "Pretty things await ♡" */}
      <div
        className="absolute right-3 sm:right-6 bottom-2 sm:bottom-4 pointer-events-none select-none text-right"
        style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive" }}
      >
        <p className="text-[#6E4F58] text-base sm:text-lg leading-[1.1]">
          Pretty
        </p>
        <p className="text-[#6E4F58] text-base sm:text-lg leading-[1.1]">
          things
        </p>
        <p className="text-[#6E4F58] text-base sm:text-lg leading-[1.1] flex items-center justify-end gap-1">
          <span>await</span>
          <span className="text-[#D28D97] text-base sm:text-lg">♡</span>
        </p>
      </div>
    </div>
  );
}
