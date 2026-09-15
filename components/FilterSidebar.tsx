"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, SlidersHorizontal, Check, RotateCcw } from "lucide-react";

interface Category {
  _id: string;
  name: string;
}

type FilterSidebarProps = {
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  maxValue: number;
  setMaxValue: (val: number) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  showFilter: boolean;
  setShowFilter: (val: boolean) => void;
  onClear: () => void;
  hideCategory?: boolean;
};

const SORT_OPTIONS = [
  { label: "Default / Newest", value: "default" },
  { label: "Price: Low to High", value: "priceLowToHigh" },
  { label: "Price: High to Low", value: "priceHighToLow" },
];

const QUICK_PRICES = [
  { label: "All", value: 100000 },
  { label: "Under ₹500", value: 500 },
  { label: "Under ₹1,000", value: 1000 },
  { label: "Under ₹2,500", value: 2500 },
  { label: "Under ₹5,000", value: 5000 },
];

export default function FilterSidebar({
  categories,
  selectedCategory,
  setSelectedCategory,
  maxValue,
  setMaxValue,
  sortBy,
  setSortBy,
  showFilter,
  setShowFilter,
  onClear,
  hideCategory = false,
}: FilterSidebarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Strict background scroll lock
  useEffect(() => {
    if (!showFilter) return;

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowFilter(false);
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showFilter, setShowFilter]);

  if (!mounted) return null;

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (maxValue < 100000 ? 1 : 0) +
    (sortBy !== "default" ? 1 : 0);

  return createPortal(
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-[99998] bg-black/45 backdrop-blur-xs transition-opacity duration-300 ${
          showFilter ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setShowFilter(false)}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Drawer: Bottom sheet on mobile (< md), Left side-drawer on desktop (md+) */}
      <aside
        className={`fixed z-[99999] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-out 
          inset-x-0 bottom-0 max-h-[88vh] rounded-t-[28px] border-t border-neutral-100
          md:inset-y-0 md:left-0 md:right-auto md:w-[380px] md:max-h-full md:rounded-none md:border-t-0 md:border-r
          ${
            showFilter
              ? "translate-y-0 md:translate-x-0"
              : "translate-y-full md:translate-y-0 md:-translate-x-full"
          }`}
        style={{ overscrollBehavior: "contain" }}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Bar */}
        <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mt-3 mb-1 md:hidden shrink-0" />

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-rose-50 text-rose-600">
              <SlidersHorizontal className="size-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Filters</h3>
              <p className="text-[11px] text-neutral-500 font-medium">
                {activeFiltersCount > 0
                  ? `${activeFiltersCount} filter${activeFiltersCount > 1 ? "s" : ""} applied`
                  : "Refine your selection"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowFilter(false)}
            aria-label="Close filters"
            className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition active:scale-95"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Filters Content */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5 space-y-7"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* CATEGORY SECTION */}
          {!hideCategory && categories && categories.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                  Category
                </h4>
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("")}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {/* All Categories Option */}
                <label
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm cursor-pointer transition border ${
                    selectedCategory === ""
                      ? "border-rose-200 bg-rose-50/60 font-semibold text-rose-950"
                      : "border-transparent bg-neutral-50/80 hover:bg-neutral-100/70 text-neutral-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid size-4 place-items-center rounded-full border transition ${
                        selectedCategory === ""
                          ? "border-rose-600 bg-rose-600"
                          : "border-neutral-300 bg-white"
                      }`}
                    >
                      {selectedCategory === "" && (
                        <div className="size-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span>All Categories</span>
                  </div>
                  {selectedCategory === "" && (
                    <Check className="size-4 text-rose-600" />
                  )}
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={selectedCategory === ""}
                    onChange={() => setSelectedCategory("")}
                    className="sr-only"
                  />
                </label>

                {/* Individual Categories */}
                {categories.map((category) => {
                  const isChecked = selectedCategory === category.name;
                  return (
                    <label
                      key={category._id}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm cursor-pointer transition border ${
                        isChecked
                          ? "border-rose-200 bg-rose-50/60 font-semibold text-rose-950"
                          : "border-transparent bg-neutral-50/80 hover:bg-neutral-100/70 text-neutral-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid size-4 place-items-center rounded-full border transition ${
                            isChecked
                              ? "border-rose-600 bg-rose-600"
                              : "border-neutral-300 bg-white"
                          }`}
                        >
                          {isChecked && (
                            <div className="size-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="capitalize">{category.name}</span>
                      </div>
                      {isChecked && <Check className="size-4 text-rose-600" />}
                      <input
                        type="radio"
                        name="category"
                        value={category.name}
                        checked={isChecked}
                        onChange={() => setSelectedCategory(category.name)}
                        className="sr-only"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* MAX PRICE SECTION */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Max Price
              </h4>
              {maxValue < 100000 && (
                <button
                  type="button"
                  onClick={() => setMaxValue(100000)}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Slider */}
              <div className="px-1">
                <input
                  type="range"
                  min={100}
                  max={20000}
                  step={100}
                  value={maxValue > 20000 ? 20000 : maxValue}
                  onChange={(e) => setMaxValue(Number(e.target.value))}
                  className="w-full accent-rose-600 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Price Tags Indicator */}
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-semibold">
                    Min
                  </span>
                  <span className="font-bold text-neutral-800">₹0</span>
                </div>
                <span className="text-neutral-300 font-semibold">-</span>
                <div className="flex-1 rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-2 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-rose-500 block font-semibold">
                    Max
                  </span>
                  <span className="font-bold text-rose-950">
                    {maxValue >= 20000 ? "Any Price" : `₹${maxValue.toLocaleString("en-IN")}`}
                  </span>
                </div>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_PRICES.map((preset) => {
                  const isSelected =
                    preset.value === 100000
                      ? maxValue >= 20000
                      : maxValue === preset.value;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setMaxValue(preset.value)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SORT BY SECTION */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Sort By
              </h4>
            </div>

            <div className="space-y-1.5">
              {SORT_OPTIONS.map((opt) => {
                const isChecked = sortBy === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm cursor-pointer transition border ${
                      isChecked
                        ? "border-rose-200 bg-rose-50/60 font-semibold text-rose-950"
                        : "border-transparent bg-neutral-50/80 hover:bg-neutral-100/70 text-neutral-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid size-4 place-items-center rounded-full border transition ${
                          isChecked
                            ? "border-rose-600 bg-rose-600"
                            : "border-neutral-300 bg-white"
                        }`}
                      >
                        {isChecked && (
                          <div className="size-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span>{opt.label}</span>
                    </div>
                    {isChecked && <Check className="size-4 text-rose-600" />}
                    <input
                      type="radio"
                      name="sort"
                      value={opt.value}
                      checked={isChecked}
                      onChange={() => setSortBy(opt.value)}
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 border-t border-neutral-100 bg-neutral-50/80 p-4 pb-6 md:pb-4 flex items-center gap-3">
          <button
            type="button"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-700 shadow-xs transition hover:bg-neutral-50 active:scale-98 cursor-pointer"
            onClick={onClear}
          >
            <RotateCcw className="size-3.5 text-neutral-400" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="flex-[2] rounded-xl bg-rose-600 hover:bg-rose-700 py-3 text-sm font-semibold text-white shadow-md shadow-rose-200 transition active:scale-98 cursor-pointer"
            onClick={() => setShowFilter(false)}
          >
            View Results
          </button>
        </div>
      </aside>
    </>,
    document.body
  );
}
