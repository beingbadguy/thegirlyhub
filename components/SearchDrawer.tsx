"use client";

import PaginationControls from "@/components/PaginationControls";
import ProductCard, { ProductCardProduct } from "@/components/ProductCard";
import axios from "axios";
import { Heart, LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type SearchDrawerProps = {
  open: boolean;
  onClose: () => void;
};

type ProductResponse = {
  products: ProductCardProduct[];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
};

export default function SearchDrawer({ open, onClose }: SearchDrawerProps) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductCardProduct[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Strict scroll lock on both html & body
  useEffect(() => {
    if (!open) return;

    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    // Auto-focus search input when opened
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => {
      clearTimeout(timer);
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  // Reset scroll position when page or query changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [page, query]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axios.get<ProductResponse>("/api/product", {
          params: { q: query.trim() || undefined, page, limit: 12 },
        });

        setProducts(response.data.products);
        setTotal(response.data.pagination.total);
        setTotalPages(response.data.pagination.totalPages || 1);
      } catch (error) {
        console.error(error);
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [open, query, page]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* overlay */}
      <div
        className={`fixed inset-0 z-[99998] bg-black/40 backdrop-blur-xs transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-[99999] flex h-full h-[100dvh] max-h-screen w-full max-w-2xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ overscrollBehavior: "contain" }}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-3.5">
          <div>
            <p className="text-xl font-semibold text-rose-600">Search</p>
            <p className="text-xs text-gray-500">
              <Heart className="inline size-3.5 mr-1 text-rose-600" />
              Find something you love
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close search"
            className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 active:scale-95"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* SEARCH */}
        <div className="shrink-0 border-b px-5 py-3">
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 focus-within:border-rose-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-100 transition-all">
            <Search className="size-4 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search products..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => handleQueryChange("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden px-5 pt-4 pb-3">
          {/* title */}
          <div className="flex shrink-0 items-center justify-between mb-3">
            <h2 className="font-medium text-gray-800 text-sm md:text-base">
              {query ? `Results for "${query}"` : "All products"}
            </h2>
            {!loading && (
              <span className="text-xs text-gray-500 font-medium">
                {total} {total === 1 ? "result" : "results"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <LoaderCircle className="animate-spin text-rose-600 size-8" />
            </div>
          ) : products.length > 0 ? (
            <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
              {/* 🔥 SCROLL AREA */}
              <div
                ref={scrollContainerRef}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 pb-6"
                style={{
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}
              >
                <div className="grid grid-cols-2 gap-3 pb-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onProductClick={onClose}
                    />
                  ))}
                </div>
              </div>

              {/* FIXED PAGINATION */}
              {totalPages > 1 && (
                <div className="shrink-0 pt-3 border-t mt-auto">
                  <PaginationControls
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    className="mt-0"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
              No products found
            </div>
          )}
        </div>
      </aside>
    </>,
    document.body
  );
}
