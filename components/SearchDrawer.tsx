"use client";

import PaginationControls from "@/components/PaginationControls";
import ProductCard, { ProductCardProduct } from "@/components/ProductCard";
import axios from "axios";
import { LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.classList.add("overflow-hidden");
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.classList.remove("overflow-hidden");
    };
  }, [open, onClose]);

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
        console.error("Failed to search products:", error);
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [open, query, page]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[1000] bg-black/30 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        aria-label="Search products"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-[1001] flex h-dvh w-full flex-col bg-white shadow-2xl transition-transform duration-300 sm:max-w-xl lg:max-w-2xl ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-rose-100 px-5 py-2 sm:px-8">
          <div>
            <p className="font-instrument text-2xl text-rose-950">Search</p>
            <p className="mt-1 text-xs text-neutral-500">
              Find something you love
            </p>
          </div>
          <button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full text-neutral-500 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="border-b border-neutral-200 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3 border-b border-neutral-300 pb-3 focus-within:border-rose-600">
            <Search className="size-3 shrink-0 text-neutral-500" />
            <input
              autoFocus={open}
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Search dresses, jewellery, accessories..."
              className="min-w-0 flex-1 bg-transparent text-base text-neutral-900 outline-none placeholder:text-neutral-400 text-sm"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => handleQueryChange("")}
                className="text-neutral-400 transition hover:text-rose-600"
              >
                <X className="size-5" />
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900 ">
              {query.trim() ? `Results for “${query.trim()}”` : "All products"}
            </h2>
            {!loading && (
              <span className="text-xs text-neutral-500">
                {total} result{total === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center">
              <LoaderCircle className="size-7 animate-spin text-rose-600" />
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    showActions={false}
                    className="rounded-none border-0 p-0 "
                  />
                ))}
              </div>
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center text-center">
              <Search className="mb-3 size-8 text-rose-300" />
              <p className="font-medium text-neutral-800">No products found</p>
              <p className="mt-1 text-sm text-neutral-500">
                Try a different search term.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
