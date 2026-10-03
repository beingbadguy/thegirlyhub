"use client";

import PaginationControls from "@/components/PaginationControls";
import ProductCard from "@/components/ProductCard";
import axios from "axios";
import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import FloralAccent from "@/components/decorations/FloralAccent";
import PredictiveSearchBar from "@/components/PredictiveSearchBar";

type Products = React.ComponentProps<typeof ProductCard>["product"];

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("q") || searchParams.get("search") || "";
  const urlPage = searchParams.get("page") ? Number(searchParams.get("page")) : 1;

  const [query, setQuery] = useState(urlQuery);
  const [products, setProducts] = useState<Products[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(urlPage);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Sync state on browser back/forward
  useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("search") || "";
    const p = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    setQuery(q);
    setPage((prev) => (prev !== p ? p : prev));
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/product", {
          params: { q: query.trim() || undefined, page, limit: 12 },
        });
        setProducts(response.data.products || []);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } catch (error: unknown) {
        console.error("Failed to search products:", error);
        setProducts([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query, page]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const handlePageChange = (newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });

    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) {
      params.set("page", String(newPage));
    } else {
      params.delete("page");
    }
    if (query.trim()) {
      params.set("q", query.trim());
    }
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search", { scroll: false });
  };

  const grid = (items: Products[]) => (
    <div className="my-4 grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-6 lg:px-8">
      <div
        className={`flex flex-col items-center justify-center transition-all duration-300 ${
          query.length > 0 ? "" : "h-[45vh]"
        }`}
      >
        <div className={`${query.length > 0 ? "hidden" : "flex"} items-center justify-center gap-2 mx-4 my-2`}>
          <FloralAccent flower={1} size="sm" animation="pulse" />
          <h1 className="text-center text-3xl md:text-4xl font-serif text-rose-950">
            What are you looking for today?
          </h1>
          <FloralAccent flower={1} size="sm" animation="pulse" className="rotate-45" />
        </div>
        <div className="my-6 w-[90%] md:w-[60%] lg:w-[50%] max-w-2xl relative z-20">
          <PredictiveSearchBar
            variant="page"
            initialValue={query}
            placeholder="Search hair claws, scrunchies, jewellery..."
            dropdownAlignment="left"
            inputClassName="py-2.5 px-4 shadow-sm text-base border-rose-200 bg-white"
            onSearchSubmit={(submittedQuery) => {
              setQuery(submittedQuery);
              const params = new URLSearchParams(searchParams.toString());
              if (submittedQuery.trim()) {
                params.set("q", submittedQuery.trim());
              } else {
                params.delete("q");
              }
              params.delete("page");
              router.push(`/search?${params.toString()}`, { scroll: false });
            }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <AiOutlineLoading3Quarters className="animate-spin text-2xl text-rose-600" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-rose-950 md:text-2xl">
                {query.trim()
                  ? `Search results for "${query.trim()}"`
                  : "All Products"}
              </h2>
              <span className="text-sm text-rose-900/60">
                {totalItems} result{totalItems !== 1 ? "s" : ""}
              </span>
            </div>
            {totalItems > 0 ? (
              <>
                {grid(products)}
                <PaginationControls
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
                <p className="mt-3 text-center text-sm text-rose-900/50">
                  Showing page {page} of {totalPages} ({totalItems} products)
                </p>
              </>
            ) : (
              <div className="my-12 text-center flex flex-col items-center justify-center">
                <FloralAccent flower={2} size="md" animation="float" className="mb-3" />
                <p className="font-serif text-lg text-rose-950 font-medium">
                  No products found matching &quot;{query}&quot;
                </p>
                <p className="text-sm text-rose-900/60 mt-1 max-w-sm">
                  Try searching for hair claws, scrunchies, earrings, or necklaces!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
