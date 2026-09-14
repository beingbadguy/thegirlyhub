"use client";

import axios, { AxiosError } from "axios";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

type Category = {
  _id: string;
  name: string;
};

type Product = React.ComponentProps<typeof ProductCard>["product"];

const CategoryProductSections = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        const [categoryResponse, productResponse] = await Promise.all([
          axios.get("/api/category", { params: { page: 1, limit: 100 } }),
          axios.get("/api/product", { params: { page: 1, limit: 100 } }),
        ]);
        setCategories(categoryResponse.data.categories ?? []);
        setProducts(productResponse.data.products ?? []);
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          console.error(error.response?.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, []);

  const productsByCategory = useMemo(() => {
    return products.reduce<Record<string, Product[]>>((groups, product) => {
      const key = product.category?.trim().toLowerCase();
      if (key) (groups[key] ??= []).push(product);
      return groups;
    }, {});
  }, [products]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl space-y-12 py-10 md:py-14">
        {[...Array(2)].map((_, sectionIndex) => (
          <div key={sectionIndex}>
            <div className="mb-5 flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(4)].map((__, productIndex) => (
                <Skeleton
                  key={productIndex}
                  className="aspect-[3/4] rounded-2xl"
                />
              ))}
            </div>
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl space-y-14 py-10 md:py-14">
      {categories.map((category) => {
        const categoryProducts =
          productsByCategory[category.name.trim().toLowerCase()] ?? [];

        if (categoryProducts.length === 0) return null;

        return (
          <section key={category._id}>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-1 ring-rose-100">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-500">
                    Curated collection
                  </p>
                  <h2 className="mt-1 font-serif text-2xl capitalize text-rose-950 sm:text-3xl">
                    {category.name}
                  </h2>
                  <p className="mt-1 text-sm text-rose-900/60">
                    Discover pieces selected for your everyday style.
                  </p>
                </div>
              </div>
              <Link
                href={`/category/${encodeURIComponent(category.name)}`}
                className="shrink-0 text-xs font-semibold text-rose-600 transition hover:text-rose-800"
              >
                See collection →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {categoryProducts.map((product) => (
                <ProductCard key={product._id} product={product} showActions />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
};

export default CategoryProductSections;
