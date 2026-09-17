"use client";

import { cachedApiGet } from "@/lib/apiCache";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, ChevronDown, Sparkles, Heart, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterSidebar from "@/components/FilterSidebar";
import PaginationControls from "@/components/PaginationControls";
import ProductCard from "@/components/ProductCard";
import BreadcrumbHome from "@/components/BreadcrumbHome";

type Product = React.ComponentProps<typeof ProductCard>["product"] & {
  description?: string;
  rating?: number;
  numReviews?: number;
  category?: string;
};

interface Category {
  _id: string;
  name: string;
}

interface ProductsClientProps {
  initialProducts?: Product[];
  initialTotal?: number;
  initialTotalPages?: number;
  initialCategories?: Category[];
}

export default function ProductsClient({
  initialProducts,
  initialTotal = 0,
  initialTotalPages = 1,
  initialCategories,
}: ProductsClientProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 100000;
  const qCategory = searchParams.get("category") || "";
  const qSort = searchParams.get("sort") || "default";
  const qPage = searchParams.get("page") ? Number(searchParams.get("page")) : 1;

  const isDefaultQuery =
    !qCategory && qMaxPrice === 100000 && qSort === "default" && qPage === 1;
  const hasInitial =
    isDefaultQuery &&
    Array.isArray(initialProducts) &&
    initialProducts.length > 0;

  const [products, setProducts] = useState<Product[]>(
    hasInitial ? (initialProducts as Product[]) : [],
  );
  const [isInitialLoading, setIsInitialLoading] = useState(!hasInitial);
  const [isFetching, setIsFetching] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [categories, setCategories] = useState<Category[]>(
    Array.isArray(initialCategories) && initialCategories.length > 0
      ? initialCategories
      : [],
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(qCategory);
  const [maxValue, setMaxValue] = useState(qMaxPrice);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(qMaxPrice);
  const [page, setPage] = useState(qPage);
  const [totalPages, setTotalPages] = useState(
    hasInitial ? initialTotalPages : 1,
  );
  const [serverTotal, setServerTotal] = useState(
    hasInitial ? initialTotal : 0,
  );
  const [sortBy, setSortBy] = useState<string>(qSort);

  const hasLoadedOnce = useRef(hasInitial);

  // Sync state when URL searchParams change
  useEffect(() => {
    const urlMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 100000;
    const urlCategory = searchParams.get("category") || "";
    const urlSort = searchParams.get("sort") || "default";
    const urlPage = searchParams.get("page") ? Number(searchParams.get("page")) : 1;

    setMaxValue(urlMaxPrice);
    setDebouncedMaxPrice(urlMaxPrice);
    setSelectedCategory(urlCategory);
    setSortBy(urlSort);
    setPage(urlPage);
  }, [searchParams]);

  // Debounce max price slider to prevent rapid API requests and flicker
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMaxPrice(maxValue);
    }, 250);
    return () => clearTimeout(timer);
  }, [maxValue]);

  const fetchCategories = async () => {
    if (Array.isArray(initialCategories) && initialCategories.length > 0) return;
    try {
      const data = await cachedApiGet<{ categories?: Category[] }>(
        "/api/category",
        { page: 1, limit: 100 },
        { ttlMs: 5 * 60 * 1000 },
      );
      setCategories(data.categories || []);
    } catch {
      // Ignore category list error
    }
  };

  const fetchAllProducts = async (pageNum = page) => {
    if (hasLoadedOnce.current) {
      setIsFetching(true);
    }
    try {
      const params: Record<string, string | number> = {
        page: pageNum,
        limit: 12,
      };
      if (selectedCategory) params.category = selectedCategory;
      if (debouncedMaxPrice < 100000) params.maxPrice = debouncedMaxPrice;
      if (sortBy !== "default") params.sort = sortBy;

      const data = await cachedApiGet<{
        products?: Product[];
        pagination?: { totalPages: number; total: number };
      }>("/api/product", params, { ttlMs: 3 * 60 * 1000 });

      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setServerTotal(data.pagination?.total ?? 0);
    } catch {
      // Keep existing products if fetch failed
    } finally {
      setIsInitialLoading(false);
      setIsFetching(false);
      hasLoadedOnce.current = true;
    }
  };

  // Fetch categories once on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products when filters or page change
  useEffect(() => {
    if (hasInitial && isDefaultQuery && page === 1) {
      return;
    }
    fetchAllProducts(page);
  }, [page, selectedCategory, debouncedMaxPrice, sortBy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count += 1;
    if (maxValue < 100000) count += 1;
    if (sortBy !== "default") count += 1;
    return count;
  }, [selectedCategory, maxValue, sortBy]);

  const handleClearFilters = () => {
    setSelectedCategory("");
    setMaxValue(100000);
    setDebouncedMaxPrice(100000);
    setSortBy("default");
    setPage(1);
    router.push("/product");
  };

  return (
    <div className="min-h-screen bg-neutral-50/40">
      {/* Top subtle loading indicator bar for seamless, non-flicker transitions */}
      <div
        className={`fixed top-0 left-0 right-0 z-[9999] h-1 bg-rose-600 transition-all duration-300 ${
          isFetching ? "opacity-100 animate-pulse" : "opacity-0"
        }`}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation - Aligned perfectly with grid */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900">Products</span>
        </nav>

        {/* Toolbar Row: Filter Button on Left & Professional Sort on Right */}
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-neutral-200/80 pb-4">
          {/* Filter Button with Icon */}
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

          {/* Right Area: Results count + Professional Sort Select */}
          <div className="flex items-center gap-3">
            {!isInitialLoading && serverTotal > 0 && (
              <span className="hidden sm:inline-block text-xs font-medium text-neutral-500">
                {serverTotal} {serverTotal === 1 ? "Product" : "Products"}
              </span>
            )}

            {/* Professional Sort Dropdown */}
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

        {/* Active Filter Chips Bar */}
        {(debouncedMaxPrice < 100000 || selectedCategory) && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Active Filters:</span>
            {debouncedMaxPrice < 100000 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200 shadow-2xs">
                <span>Under ₹{debouncedMaxPrice.toLocaleString("en-IN")}</span>
                <button
                  type="button"
                  onClick={() => setMaxValue(100000)}
                  aria-label="Remove price filter"
                  className="rounded-full hover:bg-rose-200/60 p-0.5 transition"
                >
                  <X className="size-3 text-rose-600" />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200 shadow-2xs">
                <span>Category: {selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("")}
                  aria-label="Remove category filter"
                  className="rounded-full hover:bg-rose-200/60 p-0.5 transition"
                >
                  <X className="size-3 text-rose-600" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filter Drawer / Mobile Bottom Sheet */}
        <FilterSidebar
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={(val) => {
            setSelectedCategory(val);
            setPage(1);
          }}
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
        />

        {/* Product Grid Area */}
        {isInitialLoading ? (
          /* Shimmer Skeleton during initial page load */
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
          /* Empty State */
          <div className="relative mx-auto mt-8 flex min-h-[380px] max-w-2xl items-center justify-center overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50/50 via-white to-amber-50/40 px-6 py-12 text-center shadow-xs">
            <div className="relative flex max-w-md flex-col items-center">
              <div className="relative mb-5 grid size-20 place-items-center rounded-full border-4 border-white bg-rose-100 shadow-md shadow-rose-200/50">
                <Heart className="size-8 fill-rose-500 text-rose-500" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                No results found
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-neutral-900 sm:text-3xl">
                No matching products
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Try adjusting your filters or price range to find what you&apos;re looking for.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-6 rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:bg-rose-700 active:scale-95 cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        ) : (
          /* Products Grid with smooth transition when fetching new values */
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

            {serverTotal > 0 && (
              <p className="mt-4 text-center text-xs text-neutral-400">
                Showing page {page} of {totalPages} ({serverTotal} total products)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
