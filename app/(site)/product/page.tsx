"use client";
import axios, { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { VscLoading } from "react-icons/vsc";
import { IoCloseOutline, IoFilterSharp } from "react-icons/io5";
import { useRouter } from "next/navigation";
import PaginationControls from "@/components/PaginationControls";
import ProductCard from "@/components/ProductCard";

type Product = React.ComponentProps<typeof ProductCard>["product"] & {
  description: string;
  rating: number;
  numReviews: number;
  category: string;
};

interface Category {
  _id: string;
  name: string;
}

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [fullProducts, setFullProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [maxValue, setMaxValue] = useState(100000);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [serverTotal, setServerTotal] = useState(0);
  const [sortBy, setSortBy] = useState<string>("default");

  const router = useRouter();

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/category", {
        params: { page: 1, limit: 100 },
      });
      setCategories(response.data.categories);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      }
    }
  };

  const fetchAllProducts = async (pageNum = page) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: pageNum,
        limit: 12,
      };
      if (selectedCategory) params.category = selectedCategory;

      const response = await axios.get("/api/product", { params });
      setFullProducts(response.data.products);
      setProducts(response.data.products);
      setTotalPages(response.data.pagination?.totalPages ?? 1);
      setServerTotal(response.data.pagination?.total ?? 0);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Explore Our Products | GirlyHub";
    fetchAllProducts(page);
    fetchCategories();
  }, [page, selectedCategory]);

  useEffect(() => {
    let filtered = [...fullProducts];
    if (maxValue < 100000) {
      filtered = filtered.filter((p) => p.discountedPrice <= maxValue);
    }
    const sorted = filtered;
    if (sortBy === "priceLowToHigh") {
      sorted.sort((a, b) => a.discountedPrice - b.discountedPrice);
    } else if (sortBy === "priceHighToLow") {
      sorted.sort((a, b) => b.discountedPrice - a.discountedPrice);
    } else if (sortBy === "ratingHighToLow") {
      sorted.sort((a, b) => b.rating - a.rating);
    }
    setProducts(sorted);
  }, [sortBy, maxValue, fullProducts]);

  useEffect(() => {
    document.body.style.overflow = showFilter ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showFilter]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] w-full items-center justify-center">
        <VscLoading className="animate-spin text-3xl text-pink-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="mb-4 text-sm text-gray-500">
        <span
          className="cursor-pointer hover:text-pink-600"
          onClick={() => router.push("/")}
        >
          Home
        </span>{" "}
        / <span className="text-black">Products</span>
      </div>

      {showFilter && (
        <div
          className="fixed inset-0 top-22 z-[999] bg-black/50"
          onClick={() => setShowFilter(false)}
        />
      )}

      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setShowFilter(true)}
          className="flex cursor-pointer items-center gap-2 rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200"
        >
          <IoFilterSharp className="text-xl" />
          <span>Filter</span>
        </button>
      </div>

      <div
        className={`absolute left-0 top-[88px] z-[999] flex h-full transition-all duration-300 ${
          showFilter ? "translate-x-0" : "-translate-x-[200%]"
        }`}
      >
        <IoCloseOutline
          className="absolute right-4 top-4 size-6 cursor-pointer"
          onClick={() => setShowFilter(false)}
        />
        <aside className="w-[250px] border bg-gray-50 p-4">
          <h3 className="mb-4 text-lg font-semibold">Filters</h3>
          <p className="my-2 text-sm text-black">Category</p>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full cursor-pointer rounded-md border px-2 py-1"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <p className="my-2 text-sm text-black">Max Price</p>
          <input
            type="range"
            min={0}
            max={100000}
            step={1000}
            value={maxValue}
            onChange={(e) => setMaxValue(Number(e.target.value))}
            className="w-full"
          />
          <p className="my-2 text-center text-xs text-gray-500">₹{maxValue}</p>
          <p className="my-2 text-sm text-black">Sort By</p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full cursor-pointer rounded-md border px-2 py-1"
          >
            <option value="default">Default</option>
            <option value="priceLowToHigh">Price: Low to High</option>
            <option value="priceHighToLow">Price: High to Low</option>
          </select>
          <button
            className="my-4 cursor-pointer text-sm font-semibold text-red-600 hover:underline"
            onClick={() => {
              setSelectedCategory("");
              setMaxValue(100000);
              setSortBy("default");
              setShowFilter(false);
            }}
          >
            Clear Filters
          </button>
        </aside>
      </div>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </section>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => {
          setPage(p);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {serverTotal > 0 && (
        <p className="mt-2 text-center text-sm text-rose-900/50">
          Showing page {page} of {totalPages} ({serverTotal} products)
        </p>
      )}
    </div>
  );
};

export default ProductsPage;
