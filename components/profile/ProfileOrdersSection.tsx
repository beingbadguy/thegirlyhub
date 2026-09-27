"use client";

import { useState, useRef, useEffect, useCallback, useTransition } from "react";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Package,
} from "lucide-react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import OrderDetailsCard from "@/components/OrderDetailsCart";
import PaginationControls from "@/components/PaginationControls";
import FloralAccent from "@/components/decorations/FloralAccent";
import { OrderFilterKey, OrderSortKey, StatusCounts } from "@/types/profile";
import Link from "next/link";

type Order = any;

interface ProfileOrdersSectionProps {
  orders: Order[];
  statusCounts: StatusCounts;
  totalOrdersCount: number;
  isLoading: boolean;
  orderFilter: OrderFilterKey;
  onFilterChange: (status: OrderFilterKey) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOrder: OrderSortKey;
  onSortChange: (sort: OrderSortKey) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefreshOrders: () => void;
}

const ORDER_FILTERS: { key: OrderFilterKey; label: string }[] = [
  { key: "all", label: "All Orders" },
  { key: "processing", label: "Processing" },
  { key: "reviewing", label: "Reviewing" },
  { key: "preparing", label: "Preparing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function ProfileOrdersSection({
  orders,
  statusCounts,
  totalOrdersCount,
  isLoading,
  orderFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  sortOrder,
  onSortChange,
  currentPage,
  totalPages,
  onPageChange,
  onRefreshOrders,
}: ProfileOrdersSectionProps) {
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [, startTransition] = useTransition();

  // Keep local search input synced with prop
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const checkScroll = useCallback(() => {
    const el = filterScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = filterScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, statusCounts]);

  const scrollTabs = (direction: "left" | "right") => {
    const el = filterScrollRef.current;
    if (!el) return;
    const amount = direction === "left" ? -240 : 240;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    onSearchChange("");
  };

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="rounded-3xl border border-rose-100/80 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-rose-50 pb-4">
          <div>
            <h2 className="font-serif text-2xl font-medium text-rose-950">
              Orders History & Tracking
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Live fulfillment status, shipment tracking and receipts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
              <Package className="size-3.5" />
              {totalOrdersCount} Total Orders
            </span>
          </div>
        </div>

        {/* Search Bar + Sort Dropdown */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
          {/* Search Input */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                // Instant update if cleared
                if (!e.target.value) {
                  onSearchChange("");
                }
              }}
              placeholder="Search by Order ID, item title, or recipient..."
              className="w-full rounded-2xl border border-stone-200 pl-10 pr-9 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <ArrowUpDown className="size-3.5 text-rose-700" />
              <span>Sort:</span>
            </div>
            <select
              value={sortOrder}
              onChange={(e) => onSortChange(e.target.value as OrderSortKey)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 outline-none focus:border-rose-400 transition"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Highest Amount</option>
              <option value="amount_low">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* Scrollable Status Filter Carousel */}
        <div className="relative pt-1">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollTabs("left")}
              className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 flex size-8 items-center justify-center rounded-full bg-white text-rose-800 shadow-md border border-rose-100 hover:bg-rose-50 transition-all cursor-pointer"
              aria-label="Scroll filter tabs left"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}

          <div
            ref={filterScrollRef}
            className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none"
          >
            {ORDER_FILTERS.map((filter) => {
              const count = statusCounts[filter.key] ?? 0;
              const isActive = orderFilter === filter.key;

              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => onFilterChange(filter.key)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-rose-700 text-white shadow-xs"
                      : "bg-stone-50 text-stone-700 hover:bg-rose-50 hover:text-rose-900 border border-stone-200/70"
                  }`}
                >
                  <span>{filter.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-stone-200/80 text-stone-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollTabs("right")}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex size-8 items-center justify-center rounded-full bg-white text-rose-800 shadow-md border border-rose-100 hover:bg-rose-50 transition-all cursor-pointer"
              aria-label="Scroll filter tabs right"
            >
              <ChevronRight className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Orders List / Loading / Empty States */}
      {isLoading ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-rose-100/80 bg-white p-12 text-center">
          <AiOutlineLoading3Quarters className="size-8 animate-spin text-rose-600 mb-3" />
          <p className="text-sm font-semibold text-rose-950">Updating orders...</p>
          <p className="text-xs text-stone-400 mt-1">Fetching latest real-time tracking</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex min-h-[340px] flex-col items-center justify-center rounded-3xl border border-rose-100/80 bg-white p-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4">
            <Package className="size-8" />
          </div>
          <h3 className="font-serif text-xl font-medium text-rose-950">
            {searchQuery
              ? "No orders match your search"
              : orderFilter !== "all"
              ? `No ${orderFilter} orders`
              : "No orders yet"}
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm">
            {searchQuery
              ? `We couldn't find any orders matching "${searchQuery}". Try searching with a different ID or product name.`
              : orderFilter !== "all"
              ? `You currently don't have any orders with status "${orderFilter}".`
              : "Explore our latest collection and treat yourself or your loved ones today."}
          </p>

          <div className="mt-5 flex items-center gap-3">
            {searchQuery || orderFilter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  handleClearSearch();
                  onFilterChange("all");
                }}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              >
                Clear Filters
              </button>
            ) : null}

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-2 text-xs font-semibold text-white hover:bg-rose-800 transition cursor-pointer shadow-xs"
            >
              <ShoppingBag className="size-3.5" />
              Discover Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders
            .filter((order) => order && order._id)
            .map((order) => (
              <OrderDetailsCard
                key={order._id}
                order={order}
                fetchUserOrders={onRefreshOrders}
              />
            ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-4 flex flex-col items-center gap-2">
              <PaginationControls
                page={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
              <p className="text-xs text-stone-400">
                Page {currentPage} of {totalPages}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
