"use client";

import axios, { AxiosError } from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import PaginationControls from "./PaginationControls";

interface Category {
  _id: string;
  name: string;
  categoryImage: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ShopByCategoryProps {
  /** Max categories to fetch per page (default 12) */
  limit?: number;
  /** Show "See more" button linking to /category (for home page) */
  showSeeMore?: boolean;
  /** Enable pagination controls (for categories listing page) */
  paginated?: boolean;
}

const ShopByCategory = ({
  limit = 12,
  showSeeMore = false,
  paginated = false,
}: ShopByCategoryProps) => {
  const [catLoading, setCatLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const router = useRouter();

  const fetchCategories = async (pageNum: number) => {
    setCatLoading(true);
    try {
      const response = await axios.get("/api/category", {
        params: { page: pageNum, limit },
      });
      setCategories(response.data.categories);
      setTotalPages(response.data.pagination?.totalPages ?? 1);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("An unknown error occurred:", error);
      }
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories(page);
  }, [page, limit]);

  if (catLoading) {
    return (
      <section className="mx-auto max-w-7xl py-10 md:py-14">
        <div className="mb-10 text-center">
          <Skeleton className="mx-auto h-4 w-24 rounded-full" />
          <Skeleton className="mx-auto mt-4 h-10 w-64" />
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-3">
              <Skeleton className="size-28 rounded-full sm:size-32 md:size-36" />
              <Skeleton className="h-4 w-20" />
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
          CATEGORIES
        </div>

        <h2 className="font-serif text-3xl font-medium tracking-tight text-rose-950 sm:text-4xl">
          Shop by Category
        </h2>

        <p className="mx-auto mt-3 max-w-md text-[15px] text-rose-900/60">
          Discover our carefully curated collections made just for you.
        </p>
      </div>

      <ul className="grid grid-cols-2 border border-gray-200 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((category) => (
          <li
            key={category._id}
            onClick={() =>
              router.push(`/category/${encodeURIComponent(category.name)}`)
            }
            className="group cursor-pointer border border-gray-200 bg-white transition-all duration-300 hover:bg-rose-50"
          >
            <div className="flex flex-col items-center justify-center p-6 text-center transition-all duration-300 group-hover:scale-[1.03]">

              {/* IMAGE */}
              <div className="relative mb-4 h-20 w-20 sm:h-24 sm:w-24">
                <Image
                  src={category.categoryImage}
                  alt={category.name}
                  fill
                  className="object-contain"
                />
              </div>

              {/* TITLE */}
              <h3 className="text-sm font-semibold text-gray-800 transition-colors duration-300 group-hover:text-rose-600">
                {category.name}
              </h3>
            </div>
          </li>
        ))}
      </ul>

      {showSeeMore && (
        <div className="mt-12 text-center">
          <Link
            href="/category"
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-8 py-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50"
          >
            See more categories
          </Link>
        </div>
      )}

      {paginated && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </section>
  );
};

export default ShopByCategory;
