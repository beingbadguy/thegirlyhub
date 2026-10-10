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
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500 ring-1 ring-rose-100 shadow-xs">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-500">
                    Curated collection
                  </p>
                  <div className="flex items-center gap-2">
                    <h2 className="mt-0.5 font-serif text-2xl capitalize text-rose-950 sm:text-3xl">
                      {category.name}
                    </h2>
                    <FloralAccent
                      flower={1}
                      size="xs"
                      variant="pulse"
                      className="opacity-80"
                    />
                  </div>
                  <p className="mt-0.5 text-xs sm:text-sm text-rose-900/60">
                    Discover pieces selected for your everyday style.
                  </p>
                </div>
              </div>
              <Link
                href={`/category/${encodeURIComponent(category.name)}`}
                className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-white px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:border-rose-300 shadow-2xs"
              >
                <span>See collection</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 items-stretch">
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
