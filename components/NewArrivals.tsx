"use client";

import axios, { AxiosError } from "axios";
import { Heart } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import PaginationControls from "./PaginationControls";
import { Skeleton } from "./ui/skeleton";
import ProductCard from "./ProductCard";

interface NewArrivalsProps {
  limit?: number;
  paginated?: boolean;
  showSeeMore?: boolean;
}

const NewArrivals = ({
  limit = 12,
  paginated = false,
  showSeeMore = false,
}: NewArrivalsProps) => {
  const [products, setProducts] = useState<
    React.ComponentProps<typeof ProductCard>["product"][]
  >([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    const fetchAllProducts = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/product", {
          params: { page: paginated ? page : 1, limit },
        });
        setProducts(response.data.products);
        setTotalPages(response.data.pagination?.totalPages ?? 1);
        setTotalProducts(response.data.pagination?.total ?? 0);
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          console.error(error.response?.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, [limit, paginated, page]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl py-10 md:py-14">
        <div className="mb-10 text-center">
          <Skeleton className="mx-auto h-4 w-28 rounded-full" />
          <Skeleton className="mx-auto mt-4 h-10 w-56" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="rounded-2xl bg-white p-3">
              <Skeleton className="mb-4 aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl py-10 md:py-14">
      <div className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3.5 py-1.5 text-[11px] font-medium tracking-widest text-rose-500 ring-1 ring-rose-100">
          <Heart className="size-3 fill-rose-400 text-rose-400" />
          NEW IN
        </div>
        <h2 className="font-serif text-3xl font-medium tracking-tight text-rose-950 sm:text-4xl">
          New Arrivals
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-rose-900/60">
          Fresh drops you’ll fall in love with.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-rose-900/50">No new arrivals found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} showActions />
            ))}
          </div>

          {showSeeMore && !paginated && (
            <div className="mt-12 text-center">
              <Link
                href="/newarrivals"
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-8 py-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50"
              >
                See all new arrivals →
              </Link>
            </div>
          )}

          {paginated && (
            <>
              <PaginationControls
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
              {totalProducts > 0 && (
                <p className="mt-3 text-center text-sm text-rose-900/50">
                  Showing page {page} of {totalPages} ({totalProducts} products)
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
};

export default NewArrivals;
