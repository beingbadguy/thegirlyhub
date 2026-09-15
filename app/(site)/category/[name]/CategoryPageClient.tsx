"use client";

import PaginationControls from "@/components/PaginationControls";
import ProductCard from "@/components/ProductCard";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Sparkles, SlidersHorizontal, ChevronDown } from "lucide-react";
import FilterSidebar from "@/components/FilterSidebar";
import BreadcrumbHome from "@/components/BreadcrumbHome";

type Product = React.ComponentProps<typeof ProductCard>["product"];

interface CategoryPageClientProps {
  categoryName: string;
}

export default function CategoryPageClient({ categoryName }: CategoryPageClientProps) {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [maxValue, setMaxValue] = useState(100000);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(100000);
  const [sortBy, setSortBy] = useState("default");
  const router = useRouter();
  const hasLoadedOnce = useRef(false);

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

      const response = await axios.get("/api/product", { params });
      setProducts(response.data.products || []);
      setTotalPages(response.data.pagination?.totalPages ?? 1);
      setTotal(response.data.pagination?.total ?? 0);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("An unknown error occurred:", error);
      }
    } finally {
      setIsInitialLoading(false);
      setIsFetching(false);
      hasLoadedOnce.current = true;
    }
  };

  useEffect(() => {
    setPage(1);
  }, [categoryName]);

  useEffect(() => {
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

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation - Aligned with grid */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
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

        {/* Toolbar: Filter on Left & Professional Sort on Right */}
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-neutral-200/80 pb-4">
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
          /* Empty State */
          <div className="relative mx-auto mt-8 flex min-h-[400px] max-w-2xl items-center justify-center overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50/60 via-white to-amber-50/50 px-6 py-12 text-center shadow-xs">
            <div className="relative flex max-w-md flex-col items-center">
              <div className="relative mb-5 grid size-20 place-items-center rounded-full border-4 border-white bg-rose-100 shadow-md shadow-rose-200/50">
                <Heart className="size-8 fill-rose-500 text-rose-500" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                Category Collection
              </p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-neutral-900 sm:text-3xl">
                No products in {categoryName}
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                We haven&apos;t added any matching pieces in this category yet. Explore our other lovely collections instead.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/product")}
                  className="rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-200 transition hover:bg-rose-700 active:scale-95 cursor-pointer"
                >
                  All Products
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/category")}
                  className="rounded-full border border-neutral-200 bg-white px-6 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 active:scale-95 cursor-pointer"
                >
                  Browse Categories
                </button>
              </div>
            </div>
          </div>
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
