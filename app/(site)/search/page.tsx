"use client";
import PaginationControls from "@/components/PaginationControls";
import ProductCard from "@/components/ProductCard";
import axios from "axios";
import { Search, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

type Products = React.ComponentProps<typeof ProductCard>["product"];

const Page = () => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Products[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    document.title = "Search Products | GirlyHub";

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/product", {
          params: { q: query.trim() || undefined, page, limit: 12 },
        });
        setProducts(response.data.products);
        setTotalItems(response.data.pagination.total);
        setTotalPages(response.data.pagination.totalPages || 1);
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

  const grid = (items: Products[]) => (
    <div className="my-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen w-full px-4 py-6 sm:px-6 lg:px-8">
      <div
        className={`flex flex-col items-center justify-center transition-all duration-300 ${
          query.length > 0 ? "" : "h-[50vh]"
        }`}
      >
        <h1
          className={`${
            query.length > 0 ? "hidden" : "block"
          } mx-4 my-2 w-full text-center text-3xl md:text-4xl font-serif text-rose-950`}
        >
          What do you want today?
        </h1>
        <div className="my-6 flex w-[90%] items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-1.5 shadow-sm md:w-[50%] focus-within:border-rose-400">
          <Search className="size-5 text-rose-400" />
          <input
            type="text"
            className="w-full border-none bg-transparent py-2 outline-none text-rose-950 placeholder:text-rose-300"
            placeholder="Search dresses, tops, jewellery..."
            onChange={(e) => setQuery(e.target.value)}
            value={query}
          />
          {query.length > 0 && (
            <X
              className="size-5 cursor-pointer text-rose-400 hover:text-rose-600"
              onClick={() => setQuery("")}
            />
          )}
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
                  ? `Searched Products for "${query.trim()}"`
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
                  onPageChange={(p) => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
                <p className="mt-3 text-center text-sm text-rose-900/50">
                  Showing page {page} of {totalPages} ({totalItems} products)
                </p>
              </>
            ) : (
              <p className="my-8 text-center text-rose-900/60">
                No products found matching &quot;{query}&quot;. Try another
                search term!
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Page;
