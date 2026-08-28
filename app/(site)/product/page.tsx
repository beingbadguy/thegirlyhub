"use client";
import axios, { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { VscLoading } from "react-icons/vsc";
import { IoCloseOutline, IoFilterSharp } from "react-icons/io5";
import { useRouter } from "next/navigation";
import FilterSidebar from "@/components/FilterSidebar";
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
      if (maxValue < 100000) params.maxPrice = maxValue;
      if (sortBy !== "default") params.sort = sortBy;

      const response = await axios.get("/api/product", { params });
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
  }, [page, selectedCategory, maxValue, sortBy]);

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
          className="flex cursor-pointer items-center gap-2 rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200 transition"
        >
          <IoFilterSharp className="text-xl" />
          <span>Filter & Sort</span>
        </button>

        {/* External Quick Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="cursor-pointer rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
        >
          <option value="default">Sort by: Default</option>
          <option value="priceLowToHigh">Price: Low to High</option>
          <option value="priceHighToLow">Price: High to Low</option>
        </select>
      </div>

      <FilterSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={(val) => {
          setSelectedCategory(val);
          setPage(1);
        }}
        maxValue={maxValue}
        setMaxValue={setMaxValue}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showFilter={showFilter}
        setShowFilter={setShowFilter}
        onClear={() => {
          setSelectedCategory("");
          setMaxValue(100000);
          setSortBy("default");
          setPage(1);
        }}
      />

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
