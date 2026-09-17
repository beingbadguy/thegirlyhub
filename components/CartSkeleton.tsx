"use client";

import React from "react";

export default function CartSkeleton() {
  return (
    <div className="min-h-[85vh] px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-16 bg-rose-100/70 rounded-md" />
        <div className="h-4 w-3 bg-gray-200 rounded-md" />
        <div className="h-4 w-12 bg-rose-200/80 rounded-md" />
      </div>

      {/* Title & Badge */}
      <div className="flex items-center justify-between pb-4 border-b border-rose-100/60 mb-6">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-gradient-to-r from-rose-200 to-pink-100 rounded-xl" />
          <div className="h-4 w-28 bg-gray-200/80 rounded-md" />
        </div>
        <div className="h-6 w-20 bg-rose-50 rounded-full border border-rose-100" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items List Skeletons */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="flex gap-4 p-4 rounded-2xl border border-rose-100/80 bg-white/80 backdrop-blur-xs shadow-xs"
            >
              {/* Image Shimmer */}
              <div className="relative size-24 sm:size-28 shrink-0 rounded-xl bg-gradient-to-br from-rose-100/70 via-pink-50 to-rose-100/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
              </div>

              {/* Content Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-5 w-3/4 bg-gray-200 rounded-lg" />
                    <div className="size-6 bg-rose-100/60 rounded-full shrink-0" />
                  </div>
                  <div className="h-3.5 w-1/3 bg-gray-100 rounded-md" />
                  <div className="h-3.5 w-20 bg-rose-50 rounded-md" />
                </div>

                {/* Bottom Row: Quantity Counter & Price */}
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100/70">
                  <div className="h-9 w-28 bg-gray-100 rounded-full" />
                  <div className="h-6 w-20 bg-gradient-to-r from-rose-200 to-pink-100 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary Skeleton */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm space-y-5">
            {/* Free Shipping Bar Skeleton */}
            <div className="space-y-2.5 p-4 rounded-xl bg-gradient-to-r from-rose-50/70 to-pink-50/50 border border-rose-100/60">
              <div className="flex justify-between">
                <div className="h-4 w-36 bg-rose-200/70 rounded-md" />
                <div className="h-4 w-16 bg-rose-200/70 rounded-md" />
              </div>
              <div className="h-2.5 w-full bg-rose-200/40 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-rose-400/60 rounded-full" />
              </div>
            </div>

            {/* Summary Title */}
            <div className="h-6 w-36 bg-gray-200 rounded-lg" />
            <div className="h-px w-full bg-gray-100" />

            {/* Price Rows */}
            <div className="space-y-3.5">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-4 w-16 bg-gray-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-28 bg-gray-100 rounded" />
                <div className="h-4 w-14 bg-rose-200/70 rounded" />
              </div>
            </div>

            <div className="h-px w-full bg-gray-100" />

            {/* Total Row */}
            <div className="flex justify-between items-center pt-1">
              <div className="h-5 w-24 bg-gray-200 rounded-md" />
              <div className="h-7 w-28 bg-gradient-to-r from-rose-300 to-pink-200 rounded-lg" />
            </div>

            {/* Checkout Button Skeleton */}
            <div className="h-13 w-full bg-gradient-to-r from-rose-500 to-pink-600 opacity-70 rounded-xl" />

            <div className="h-3 w-4/5 mx-auto bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
