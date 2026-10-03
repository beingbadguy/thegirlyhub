"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useTransition,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  FolderOpen,
  CornerDownLeft,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { productUrl } from "@/lib/slug";
import axios from "axios";

export interface SuggestProduct {
  _id: string;
  title: string;
  slug: string;
  image: string;
  price: number;
  discountedPrice: number;
  discountPercentage: number;
  stock: number;
  category: string;
}

export interface SuggestCategory {
  _id?: string;
  name: string;
  slug?: string;
  categoryImage?: string;
}

interface SuggestResponse {
  success: boolean;
  query: string;
  total: number;
  products: SuggestProduct[];
  categories: SuggestCategory[];
  popularSearches?: string[];
}

const RECENT_SEARCHES_KEY = "girlyhub_recent_searches";
const MAX_RECENT_SEARCHES = 4;

interface PredictiveSearchBarProps {
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  placeholder?: string;
  autoFocus?: boolean;
  initialValue?: string;
  variant?: "header" | "drawer" | "page";
  dropdownAlignment?: "left" | "right" | "auto";
  onSearchSubmit?: (query: string) => void;
  onCloseParent?: () => void;
}

export default function PredictiveSearchBar({
  className = "",
  inputClassName = "",
  dropdownClassName = "",
  placeholder = "Search jewellery, hair claws, scrunchies...",
  autoFocus = false,
  initialValue = "",
  variant = "header",
  dropdownAlignment = "auto",
  onSearchSubmit,
  onCloseParent,
}: PredictiveSearchBarProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(initialValue);

  // Sync initialValue changes
  useEffect(() => {
    if (initialValue !== undefined) {
      setQuery(initialValue);
    }
  }, [initialValue]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    products: SuggestProduct[];
    categories: SuggestCategory[];
    total: number;
    popularSearches: string[];
  }>({
    products: [],
    categories: [],
    total: 0,
    popularSearches: [
      "Jhumkas",
      "Hair Claws",
      "Bracelets",
      "Bangels",
      "Pendants",
      "Scrunchies",
    ],
  });

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, MAX_RECENT_SEARCHES));
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  const saveRecentSearch = useCallback((searchTerm: string) => {
    const term = searchTerm.trim();
    if (!term) return;
    setRecentSearches((prev) => {
      const updated = [term, ...prev.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // LocalStorage unavailable
      }
      return updated;
    });
  }, []);

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== termToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {
        // LocalStorage error
      }
      return updated;
    });
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // LocalStorage error
    }
  };

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const { data } = await axios.get<SuggestResponse>("/api/search/suggest", {
        params: { q: searchQuery.trim() || undefined, limit: 6 },
      });

      if (data && data.success) {
        setResults({
          products: data.products || [],
          categories: data.categories || [],
          total: data.total || 0,
          popularSearches: data.popularSearches || [
            "Jhumkas",
            "Hair Claws",
            "Bracelets",
            "Bangels",
            "Pendants",
            "Scrunchies",
          ],
        });
      }
    } catch (err) {
      console.error("Failed to fetch search suggestions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced input change
  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    if (!isOpen) setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 180);
  };

  // Perform search / navigation
  const executeSearch = (searchQuery: string) => {
    const clean = searchQuery.trim();
    if (!clean) return;
    saveRecentSearch(clean);
    setIsOpen(false);
    onCloseParent?.();
    if (onSearchSubmit) {
      onSearchSubmit(clean);
    } else {
      startTransition(() => {
        router.push(`/search?q=${encodeURIComponent(clean)}`);
      });
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    saveRecentSearch(categoryName);
    setIsOpen(false);
    onCloseParent?.();
    startTransition(() => {
      router.push(`/category/${encodeURIComponent(categoryName)}`);
    });
  };

  const handleProductClick = (product: SuggestProduct) => {
    saveRecentSearch(product.title);
    setIsOpen(false);
    onCloseParent?.();
    startTransition(() => {
      router.push(productUrl(product.title, product._id, product.slug));
    });
  };

  // Calculate total navigable items for keyboard navigation
  const isQueryMode = query.trim().length > 0;
  const categoriesList = isQueryMode ? results.categories : [];
  const productsList = results.products;
  const totalNavItems =
    categoriesList.length +
    productsList.length +
    (isQueryMode ? 1 : 0); // 1 for "View all results"

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setSelectedIndex((prev) =>
        prev < totalNavItems - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : totalNavItems - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < totalNavItems) {
        // Check what item is selected
        if (selectedIndex < categoriesList.length) {
          handleCategoryClick(categoriesList[selectedIndex].name);
          return;
        }
        const prodIndex = selectedIndex - categoriesList.length;
        if (prodIndex < productsList.length) {
          handleProductClick(productsList[prodIndex]);
          return;
        }
        // "View all results" option
        executeSearch(query);
      } else {
        executeSearch(query);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Highlight matched letters in product title
  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span
          key={index}
          className="bg-rose-100 text-rose-900 font-semibold px-0.5 rounded"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
    >
      {/* Search Input Bar */}
      <div
        className={`group relative flex items-center gap-2.5 rounded-full border transition-all duration-200 ${
          isOpen
            ? "border-rose-400 bg-white ring-2 ring-rose-200/60 shadow-md"
            : "border-rose-200/80 bg-rose-50/40 hover:border-rose-300 hover:bg-white"
        } px-3.5 py-2 ${inputClassName}`}
      >
        <Search
          className={`size-4 shrink-0 transition-colors ${
            isOpen ? "text-rose-600" : "text-gray-400 group-hover:text-rose-500"
          }`}
        />

        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            setIsOpen(true);
            if (!results.products.length && !results.categories.length) {
              fetchSuggestions(query);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
        />

        {/* Clear & Loading states */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isLoading && (
            <Loader2 className="size-4 animate-spin text-rose-500" />
          )}

          {query && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedIndex(-1);
                fetchSuggestions("");
                inputRef.current?.focus();
              }}
              className="rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}

          {/* Shortcut badge on desktop header */}
          {variant === "header" && !query && (
            <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 select-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Floating Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute ${
              dropdownAlignment === "right"
                ? "right-0 left-auto"
                : dropdownAlignment === "left"
                ? "left-0 right-auto"
                : "left-0 sm:left-auto sm:right-0"
            } top-full mt-2 w-full min-w-[280px] sm:min-w-[420px] md:min-w-[480px] lg:min-w-[520px] max-w-[95vw] md:max-w-xl rounded-2xl border border-rose-100 bg-white/98 backdrop-blur-md shadow-2xl z-[1000] overflow-hidden ${dropdownClassName}`}
            style={{
              maxHeight: "min(520px, calc(100vh - 120px))",
            }}
          >
            <div className="overflow-y-auto max-h-[500px] divide-y divide-gray-100 overscroll-contain">
              {/* SECTION: When query is empty (Recent & Trending Searches) */}
              {!isQueryMode && (
                <div className="p-4 space-y-4">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-rose-500" />
                          Recent Searches
                        </span>
                        <button
                          type="button"
                          onClick={clearAllRecent}
                          className="text-[11px] font-normal text-rose-600 hover:underline lowercase"
                        >
                          Clear all
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term) => (
                          <div
                            key={term}
                            onClick={() => {
                              setQuery(term);
                              executeSearch(term);
                            }}
                            className="group flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50/80 px-3 py-1 text-xs text-gray-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition-all"
                          >
                            <span>{term}</span>
                            <button
                              type="button"
                              onClick={(e) => removeRecentSearch(e, term)}
                              className="text-gray-400 group-hover:text-rose-600 hover:bg-rose-100 rounded-full p-0.5"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Searches */}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      <TrendingUp className="size-3.5 text-rose-500" />
                      Popular Searches
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {results.popularSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setQuery(term);
                            executeSearch(term);
                          }}
                          className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50/60 px-3 py-1 text-xs text-rose-800 hover:border-rose-300 hover:bg-rose-100 cursor-pointer transition-all"
                        >
                          <Sparkles className="size-3 text-rose-500" />
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Popular Categories */}
                  {results.categories.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        <FolderOpen className="size-3.5 text-rose-500" />
                        Explore Categories
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {results.categories.map((cat) => (
                          <div
                            key={cat._id || cat.name}
                            onClick={() => handleCategoryClick(cat.name)}
                            className="flex items-center gap-2 p-2 rounded-xl border border-gray-100 hover:border-rose-200 hover:bg-rose-50/60 cursor-pointer transition-all group"
                          >
                            {cat.categoryImage ? (
                              <div className="relative size-8 rounded-lg overflow-hidden shrink-0 bg-rose-50">
                                <Image
                                  src={cat.categoryImage}
                                  alt={cat.name}
                                  fill
                                  sizes="32px"
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="size-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 text-xs font-semibold">
                                {cat.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs font-medium text-gray-800 group-hover:text-rose-700 truncate">
                              {cat.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: Query mode with suggestions */}
              {isQueryMode && (
                <>
                  {/* Category matches */}
                  {categoriesList.length > 0 && (
                    <div className="p-3 bg-rose-50/30">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
                        <FolderOpen className="size-3 text-rose-500" />
                        Matching Categories
                      </div>
                      <div className="space-y-1">
                        {categoriesList.map((cat, idx) => {
                          const isHighlighted = selectedIndex === idx;
                          return (
                            <div
                              key={cat._id || cat.name}
                              onClick={() => handleCategoryClick(cat.name)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                                isHighlighted
                                  ? "bg-rose-100 text-rose-950 font-medium"
                                  : "text-gray-700 hover:bg-rose-50 hover:text-rose-900"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-gray-400">Search for</span>
                                <span className="font-semibold text-rose-600">
                                  &quot;{query}&quot;
                                </span>
                                <span className="text-gray-400">in</span>
                                <span className="font-medium text-gray-900 underline decoration-rose-300">
                                  {cat.name}
                                </span>
                              </div>
                              <ArrowRight className="size-3 text-gray-400 shrink-0 ml-2" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Product matches */}
                  {productsList.length > 0 ? (
                    <div className="p-3">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
                        <span>Products</span>
                        <span className="text-[10px] text-gray-400 lowercase font-normal">
                          {results.total} matching
                        </span>
                      </div>

                      <div className="space-y-1">
                        {productsList.map((product, pIdx) => {
                          const itemIndex = categoriesList.length + pIdx;
                          const isHighlighted = selectedIndex === itemIndex;

                          return (
                            <div
                              key={product._id}
                              onClick={() => handleProductClick(product)}
                              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                                isHighlighted
                                  ? "bg-rose-50/90 ring-1 ring-rose-200"
                                  : "hover:bg-rose-50/50"
                              }`}
                            >
                              {/* Product Thumbnail */}
                              <div className="relative size-12 rounded-lg overflow-hidden shrink-0 bg-rose-50 border border-rose-100">
                                {product.image ? (
                                  <Image
                                    src={product.image}
                                    alt={product.title}
                                    fill
                                    sizes="48px"
                                    unoptimized
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="size-full flex items-center justify-center text-rose-400 text-xs font-semibold">
                                    GH
                                  </div>
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 line-clamp-1">
                                  {highlightMatch(product.title, query)}
                                </p>

                                <div className="flex items-center gap-2 mt-0.5">
                                  {/* Price */}
                                  <span className="text-xs font-bold text-rose-600">
                                    ₹{product.discountedPrice}
                                  </span>
                                  {product.price > product.discountedPrice && (
                                    <span className="text-[10px] text-gray-400 line-through">
                                      ₹{product.price}
                                    </span>
                                  )}
                                  {product.discountPercentage > 0 && (
                                    <span className="text-[9px] font-semibold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full">
                                      {product.discountPercentage}% OFF
                                    </span>
                                  )}
                                  {product.category && (
                                    <span className="text-[10px] text-gray-400 capitalize hidden sm:inline">
                                      • {product.category}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Scarcity badge or view arrow */}
                              <div className="shrink-0 text-right">
                                {product.stock > 0 && product.stock <= 5 ? (
                                  <span className="text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-full inline-block">
                                    Only {product.stock} left!
                                  </span>
                                ) : product.stock === 0 ? (
                                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                    Out of stock
                                  </span>
                                ) : (
                                  <ArrowRight className="size-3.5 text-gray-300 group-hover:text-rose-500" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    !isLoading && (
                      <div className="p-6 text-center space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          No products found matching &quot;{query}&quot;
                        </p>
                        <p className="text-xs text-gray-500">
                          Try searching for bangles, jhumkas, hair claws, or scrunchies.
                        </p>
                        <div className="pt-2 flex justify-center gap-1.5 flex-wrap">
                          {results.popularSearches.slice(0, 4).map((term) => (
                            <button
                              key={term}
                              type="button"
                              onClick={() => {
                                setQuery(term);
                                executeSearch(term);
                              }}
                              className="text-xs px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  {/* BOTTOM: "View all results" action */}
                  <div
                    onClick={() => executeSearch(query)}
                    className={`flex items-center justify-between px-4 py-3 bg-gray-50/80 hover:bg-rose-50/80 cursor-pointer border-t border-gray-100 transition-colors ${
                      selectedIndex === totalNavItems - 1
                        ? "bg-rose-100/90 text-rose-950"
                        : "text-gray-800"
                    }`}
                  >
                    <span className="text-xs font-medium text-rose-700 flex items-center gap-1.5">
                      <Search className="size-3.5" />
                      View all {results.total > 0 ? results.total : ""} results for &quot;
                      <span className="font-semibold">{query}</span>&quot;
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      Press <CornerDownLeft className="size-3" />
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
