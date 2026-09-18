"use client";

import PaginationControls from "@/components/PaginationControls";
import ProductCard from "@/components/ProductCard";
import { cachedApiGet } from "@/lib/apiCache";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Sparkles, SlidersHorizontal, ChevronDown } from "lucide-react";
import FilterSidebar from "@/components/FilterSidebar";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import CategoryEmptyState from "@/components/CategoryEmptyState";
import FloralAccent from "@/components/decorations/FloralAccent";

type Product = React.ComponentProps<typeof ProductCard>["product"];

interface CategoryPageClientProps {
  categoryName: string;
  initialProducts?: Product[];
  initialTotal?: number;
  initialTotalPages?: number;
}

export default function CategoryPageClient({
  categoryName,
  initialProducts,
  initialTotal = 0,
  initialTotalPages = 1,
}: CategoryPageClientProps) {
  const hasInitial = Array.isArray(initialProducts) && initialProducts.length > 0;
  const [isInitialLoading, setIsInitialLoading] = useState(!hasInitial);
  const [isFetching, setIsFetching] = useState(false);
  const [products, setProducts] = useState<Product[]>(
    hasInitial ? (initialProducts as Product[]) : [],
  );
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(
    hasInitial ? initialTotalPages : 1,
  );
  const [total, setTotal] = useState(hasInitial ? initialTotal : 0);
  const [showFilter, setShowFilter] = useState(false);
  const [maxValue, setMaxValue] = useState(100000);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(100000);
  const [sortBy, setSortBy] = useState("default");
  const router = useRouter();
  const hasLoadedOnce = useRef(hasInitial);

  // Debounce max price slider
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMaxPrice(maxValue);
    }, 250);
    return () => clearTimeout(timer);
  }, [maxValue]);

  const fetchProducts = async (pageNum: number) => {
    if (hasLoadedOnce.current) {
      setIsFetching(true);
    }
    try {
      const params: Record<string, string | number> = {
        page: pageNum,
        limit: 12,
        category: categoryName,
      };
      if (debouncedMaxPrice < 100000) params.maxPrice = debouncedMaxPrice;
      if (sortBy !== "default") params.sort = sortBy;

      const data = await cachedApiGet<{
        products?: Product[];
        pagination?: { totalPages: number; total: number };
      }>("/api/product", params, { ttlMs: 3 * 60 * 1000 });

      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } catch (error: unknown) {
      // Keep existing products if fetch failed
    } finally {
      setIsInitialLoading(false);
      setIsFetching(false);
      hasLoadedOnce.current = true;
    }
  };

  useEffect(() => {
    // If we have initial products and default filters on page 1, skip re-fetching
    if (
      hasInitial &&
      page === 1 &&
      debouncedMaxPrice === 100000 &&
      sortBy === "default"
    ) {
      return;
    }
    fetchProducts(page);
  }, [categoryName, page, debouncedMaxPrice, sortBy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (maxValue < 100000) count += 1;
    if (sortBy !== "default") count += 1;
    return count;
  }, [maxValue, sortBy]);

  const handleClearFilters = () => {
    setMaxValue(100000);
    setDebouncedMaxPrice(100000);
    setSortBy("default");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-neutral-50/40">
      {/* Top subtle loading indicator bar for seamless transitions */}
      <div
        className={`fixed top-0 left-0 right-0 z-[9999] h-1 bg-rose-600 transition-all duration-300 ${
          isFetching ? "opacity-100 animate-pulse" : "opacity-0"
        }`}
      />

      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        {/* Breadcrumb Navigation - Aligned with grid */}
        <nav
          aria-label="Breadcrumb"
          className="mb-2.5 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <button
            type="button"
            className="cursor-pointer hover:text-rose-600 transition"
            onClick={() => router.push("/category")}
          >
            Categories
          </button>
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900 capitalize">
            {categoryName}
          </span>
        </nav>

        {/* Category Header Banner with Floral Accents */}
        <div className="mb-6 relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-50 via-rose-50/70 to-pink-50 border border-rose-100/70 px-6 py-6 sm:px-8 sm:py-8 shadow-xs">
          <div className="pointer-events-none absolute -top-4 -right-4 opacity-40 sm:opacity-70">
            <FloralAccent flower={1} size="lg" variant="float" className="rotate-12" />
          </div>
          <div className="pointer-events-none absolute -bottom-6 -left-4 opacity-30 sm:opacity-50">
            <FloralAccent flower={2} size="md" variant="float-delayed" className="-rotate-12" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-xs px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-rose-600 ring-1 ring-rose-200/50 mb-2">
              <Sparkles className="size-3 text-rose-500" />
              <span>Curated Category</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold capitalize text-rose-950">
              {categoryName}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-rose-900/70 max-w-xl">
              Explore our boutique collection of {categoryName}, styled to give you effortless glam.
            </p>
          </div>
        </div>

        {/* Toolbar: Filter on Left & Professional Sort on Right */}
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-neutral-200/80 pb-3">
          <button
            type="button"
            onClick={() => setShowFilter(true)}
            className="group inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-800 shadow-xs transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-95 cursor-pointer"
          >
            <SlidersHorizontal className="size-4 text-neutral-500 transition group-hover:text-rose-600" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Right Area */}
          <div className="flex items-center gap-3">
            {!isInitialLoading && total > 0 && (
              <span className="hidden sm:inline-block text-xs font-medium text-neutral-500">
                {total} {total === 1 ? "Product" : "Products"}
              </span>
            )}

            {/* Professional Sort Select */}
            <div className="relative inline-block">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="appearance-none cursor-pointer rounded-xl border border-neutral-200 bg-white py-2 pl-3.5 pr-8 text-sm font-medium text-neutral-800 shadow-xs transition hover:border-neutral-300 hover:bg-neutral-50 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
              >
                <option value="default">Sort by: Default</option>
                <option value="priceLowToHigh">Price: Low to High</option>
                <option value="priceHighToLow">Price: High to Low</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
            </div>
          </div>
        </div>

        {/* Filter Drawer */}
        <FilterSidebar
          categories={[]}
          selectedCategory={categoryName}
          setSelectedCategory={() => {}}
          maxValue={maxValue}
          setMaxValue={(val) => {
            setMaxValue(val);
            setPage(1);
          }}
          sortBy={sortBy}
          setSortBy={(val) => {
            setSortBy(val);
            setPage(1);
          }}
          showFilter={showFilter}
          setShowFilter={setShowFilter}
          onClear={handleClearFilters}
          hideCategory={true}
        />

        {/* Content Area */}
        {isInitialLoading ? (
          /* Shimmer Skeleton */
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse rounded-2xl border border-neutral-100 bg-white p-3 md:rounded-3xl md:p-4"
              >
                <div className="aspect-square w-full rounded-xl bg-neutral-200/80 mb-3" />
                <div className="h-4 w-3/4 rounded bg-neutral-200 mb-2" />
                <div className="h-4 w-1/3 rounded bg-neutral-200" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <CategoryEmptyState categoryName={categoryName} />
        ) : (
          /* Products Grid with smooth transition */
          <div
            className={`transition-opacity duration-200 ${
              isFetching ? "opacity-60 pointer-events-none" : "opacity-100"
            }`}
          >
            <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </section>

            {/* Pagination Controls */}
            <div className="mt-8">
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>

            {total > 0 && (
              <p className="mt-4 text-center text-xs text-neutral-400">
                Showing page {page} of {totalPages} ({total} total products)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
