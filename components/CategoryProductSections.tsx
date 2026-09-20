import { Sparkles } from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import FloralAccent from "@/components/decorations/FloralAccent";

type Category = {
  _id: string;
  name: string;
};

type Product = React.ComponentProps<typeof ProductCard>["product"];

interface CategoryProductSectionsProps {
  initialCategories?: Category[];
  initialProducts?: Product[];
}

/**
 * Server Component: Renders product collections grouped by category.
 * Zero client-side JS overhead for this section wrapper.
 */
export default function CategoryProductSections({
  initialCategories = [],
  initialProducts = [],
}: CategoryProductSectionsProps) {
  if (!initialCategories.length || !initialProducts.length) {
    return null;
  }

  // Group products by lowercase category on the server
  const productsByCategory: Record<string, Product[]> = {};
  for (const product of initialProducts) {
    const key = product.category?.trim().toLowerCase();
    if (key) {
      (productsByCategory[key] ??= []).push(product);
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-14 py-10 md:py-14">
      {initialCategories.map((category) => {
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
                  <div className="flex items-center gap-2">
                    <h2 className="mt-1 font-serif text-2xl capitalize text-rose-950 sm:text-3xl">
                      {category.name}
                    </h2>
                    <FloralAccent
                      flower={1}
                      size="xs"
                      variant="pulse"
                      className="opacity-80"
                    />
                  </div>
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
              {categoryProducts.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} showActions />
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}
