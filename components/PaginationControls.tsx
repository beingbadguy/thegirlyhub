"use client";

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

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}

export default function PaginationControls({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);

  const btnBase =
    "inline-flex size-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
      aria-label="Pagination"
    >
      <button
        type="button"
        aria-label="First page"
        disabled={page === 1}
        onClick={() => onPageChange(1)}
        className={btnBase}
      >
        <ChevronsLeft className="size-4" />
      </button>

      <button
        type="button"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className={btnBase}
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="px-1 text-sm text-rose-400"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            onClick={() => onPageChange(p)}
            className={`inline-flex size-9 items-center justify-center rounded-lg text-sm font-medium transition ${
              p === page
                ? "bg-rose-600 text-white shadow-sm"
                : "border border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        aria-label="Next page"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className={btnBase}
      >
        <ChevronRight className="size-4" />
      </button>

      <button
        type="button"
        aria-label="Last page"
        disabled={page === totalPages}
        onClick={() => onPageChange(totalPages)}
        className={btnBase}
      >
        <ChevronsRight className="size-4" />
      </button>
    </nav>
  );
}
