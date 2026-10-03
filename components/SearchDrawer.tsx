"use client";

import PaginationControls from "@/components/PaginationControls";
import ProductCard, { ProductCardProduct } from "@/components/ProductCard";
import axios from "axios";
import { ArrowRight, Heart, LoaderCircle, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import FloralAccent from "@/components/decorations/FloralAccent";

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
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [matchingCategories, setMatchingCategories] = useState<{ name: string; _id?: string }[]>([]);
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
        const cleanQuery = query.trim();
        const promises: Promise<any>[] = [
          axios.get<ProductResponse>("/api/product", {
            params: { q: cleanQuery || undefined, page, limit: 12 },
          }),
        ];

        if (cleanQuery) {
          promises.push(
            axios.get("/api/search/suggest", {
              params: { q: cleanQuery, limit: 6 },
            })
          );
        }

        const results = await Promise.allSettled(promises);
        const productRes = results[0];
        const suggestRes = cleanQuery ? results[1] : null;

        if (productRes.status === "fulfilled") {
          setProducts(productRes.value.data.products);
          setTotal(productRes.value.data.pagination.total);
          setTotalPages(productRes.value.data.pagination.totalPages || 1);
        }

        if (suggestRes && suggestRes.status === "fulfilled") {
          setMatchingCategories(suggestRes.value.data.categories || []);
        } else if (!cleanQuery) {
          setMatchingCategories([]);
        }
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
        <div className="flex shrink-0 items-center justify-between border-b px-5 py-3.5 bg-[#fffafc]">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-xl font-semibold text-rose-600 font-serif">Search</p>
              <p className="text-xs text-gray-500">
                <Heart className="inline size-3.5 mr-1 text-rose-600" />
                Find something you love
              </p>
            </div>
            <FloralAccent flower={1} size="xs" variant="pulse" className="ml-1" />
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  onClose();
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }
              }}
              placeholder="Search products, categories..."
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

        {/* CATEGORY SUGGESTIONS */}
        {query.trim() && matchingCategories.length > 0 ? (
          <div className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 overflow-x-auto no-scrollbar border-b bg-rose-50/30">
            <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="size-3 text-rose-500" /> Categories:
            </span>
            {matchingCategories.map((cat) => (
              <button
                key={cat._id || cat.name}
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/category/${encodeURIComponent(cat.name)}`);
                }}
                className="text-xs px-2.5 py-1 rounded-full border border-rose-200 bg-white text-rose-800 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shrink-0 font-medium shadow-2xs"
              >
                📁 {cat.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="shrink-0 flex items-center gap-1.5 px-5 py-2 overflow-x-auto no-scrollbar border-b bg-rose-50/20">
            <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider shrink-0">
              Popular:
            </span>
            {["Jhumkas", "Hair Claws", "Bracelets", "Bangels", "Pendants", "Scrunchies"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleQueryChange(term)}
                className={`text-xs px-2.5 py-0.5 rounded-full border transition-all shrink-0 ${
                  query.toLowerCase() === term.toLowerCase()
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-rose-300 hover:text-rose-600"
                }`}
              >
                {term}
              </button>
            ))}
          </div>
        )}

        {/* CONTENT */}
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden px-5 pt-4 pb-3">
          {/* title */}
          <div className="flex shrink-0 items-center justify-between mb-3">
            <h2 className="font-medium text-gray-800 text-sm md:text-base">
              {query ? `Results for "${query}"` : "All products"}
            </h2>
            <div className="flex items-center gap-3">
              {!loading && (
                <span className="text-xs text-gray-500 font-medium">
                  {total} {total === 1 ? "result" : "results"}
                </span>
              )}
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-0.5"
                >
                  View full results <ArrowRight className="size-3" />
                </button>
              )}
            </div>
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
