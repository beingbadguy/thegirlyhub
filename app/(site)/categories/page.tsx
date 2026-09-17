import type { Metadata } from "next";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import StaggeringCategories from "@/components/StaggeringCategories";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_CONFIG } from "@/lib/seo/config";
import { generateBreadcrumbSchema } from "@/lib/seo/schema";
import { getSSRHomeCategories } from "@/lib/ssrData";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Explore Categories | Trendy Hair Claws & Jewellery",
  description:
    "Browse through GirlyHub categories. From everyday scrunchies to luxury earrings and hair claws, find your favorite pieces.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/categories`,
  },
};

export default async function CategoriesPage() {
  const categories = await getSSRHomeCategories(100);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Categories", url: "/categories" },
  ]);

  return (
    <div className="min-h-[70vh] bg-[#fffafb]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <JsonLd data={breadcrumbSchema} />
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900">Categories</span>
        </nav>
        <StaggeringCategories
          limit={100}
          showViewAll={false}
          initialCategories={categories}
        />
      </div>
    </div>
  );
}

