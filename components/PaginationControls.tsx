"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const safeCurrent = Math.max(1, Math.min(total, current));
  const pages: (number | "...")[] = [1];

  if (safeCurrent > 3) pages.push("...");

  const start = Math.max(2, safeCurrent - 1);
  const end = Math.min(total - 1, safeCurrent + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (safeCurrent < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}

export default function PaginationControls({
  page,
  totalPages,
  onPageChange,
  className = "mt-8",
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const safePage = Math.max(1, Math.min(totalPages, page));
  const pages = getPageNumbers(safePage, totalPages);

  const isPrevDisabled = safePage <= 1;
  const isNextDisabled = safePage >= totalPages;

  const btnIconBase =
    "inline-flex size-9 items-center justify-center rounded-xl border border-rose-200/90 bg-white text-rose-700 shadow-2xs transition-all hover:border-rose-300 hover:bg-rose-50 active:scale-95 disabled:pointer-events-none disabled:opacity-40 cursor-pointer";

  const btnNavBase =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-200/90 bg-white px-3 text-xs sm:text-sm font-semibold text-rose-800 shadow-2xs transition-all hover:border-rose-300 hover:bg-rose-50 active:scale-95 disabled:pointer-events-none disabled:opacity-40 cursor-pointer";

  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 ${className}`}
      aria-label="Pagination Navigation"
    >
      {/* First Page Button */}
      <button
        type="button"
        title="First page"
        aria-label="Go to first page"
        disabled={isPrevDisabled}
        onClick={() => {
          if (!isPrevDisabled) onPageChange(1);
        }}
        className={btnIconBase}
      >
        <ChevronsLeft className="size-4" />
      </button>

      {/* Prev Page Button with visible label */}
      <button
        type="button"
        title="Previous page"
        aria-label="Go to previous page"
        disabled={isPrevDisabled}
        onClick={() => {
          if (!isPrevDisabled) onPageChange(safePage - 1);
        }}
        className={btnNavBase}
      >
        <ChevronLeft className="size-4 flex-shrink-0" />
        <span>Prev</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1.5 text-sm font-bold text-rose-300 select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              aria-label={`Page ${p}`}
              aria-current={p === safePage ? "page" : undefined}
              onClick={() => {
                if (p !== safePage) onPageChange(p);
              }}
              className={`inline-flex size-9 items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${p === safePage
                  ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-200 ring-offset-1 pointer-events-none"
                  : "border border-rose-200/80 bg-white text-neutral-700 hover:border-rose-300 hover:bg-rose-50 active:scale-95"
                }`}
            >
              {p}
            </button>
          ),
        )}
      </div>

      {/* Next Page Button with visible label */}
      <button
        type="button"
        title="Next page"
        aria-label="Go to next page"
        disabled={isNextDisabled}
        onClick={() => {
          if (!isNextDisabled) onPageChange(safePage + 1);
        }}
        className={btnNavBase}
      >
        <span>Next</span>
        <ChevronRight className="size-4 flex-shrink-0" />
      </button>

      {/* Last Page Button */}
      <button
        type="button"
        title="Last page"
        aria-label="Go to last page"
        disabled={isNextDisabled}
        onClick={() => {
          if (!isNextDisabled) onPageChange(totalPages);
        }}
        className={btnIconBase}
      >
        <ChevronsRight className="size-4" />
      </button>
    </nav>
  );
}

