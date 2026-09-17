"use client";

import { cachedApiGet } from "@/lib/apiCache";
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

interface CategoryProductSectionsProps {
  initialCategories?: Category[];
  initialProducts?: Product[];
}

const CategoryProductSections = ({
  initialCategories,
  initialProducts,
}: CategoryProductSectionsProps) => {
  const hasInitial =
    Array.isArray(initialCategories) &&
    initialCategories.length > 0 &&
    Array.isArray(initialProducts) &&
    initialProducts.length > 0;

  const [categories, setCategories] = useState<Category[]>(
    hasInitial ? (initialCategories as Category[]) : [],
  );
  const [products, setProducts] = useState<Product[]>(
    hasInitial ? (initialProducts as Product[]) : [],
  );
  const [loading, setLoading] = useState(!hasInitial);

  useEffect(() => {
    if (hasInitial) return;

    let active = true;
    const fetchCategoryProducts = async () => {
      try {
        const [categoryData, productData] = await Promise.all([
          cachedApiGet<{ categories?: Category[] }>(
            "/api/category",
            { page: 1, limit: 100 },
            { ttlMs: 5 * 60 * 1000 },
          ),
          cachedApiGet<{ products?: Product[] }>(
            "/api/product",
            { page: 1, limit: 100 },
            { ttlMs: 3 * 60 * 1000 },
          ),
        ]);
        if (active) {
          setCategories(categoryData.categories ?? []);
          setProducts(productData.products ?? []);
          setLoading(false);
        }
      } catch (error: unknown) {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCategoryProducts();
    return () => {
      active = false;
    };
  }, [hasInitial]);

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
