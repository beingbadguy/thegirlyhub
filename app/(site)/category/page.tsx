import type { Metadata } from "next";
import StaggeringCategories from "@/components/StaggeringCategories";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_CONFIG } from "@/lib/seo/config";
import { generateBreadcrumbSchema } from "@/lib/seo/schema";
import { getSSRHomeCategories } from "@/lib/ssrData";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop All Categories | Trendy Accessories & Jewellery",
  description:
    "Explore all product categories at GirlyHub. Discover stylish hair accessories, Korean clips, scrunchies, earrings, and fashion jewellery.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/category`,
  },
  openGraph: {
    title: `Shop All Categories | ${SITE_CONFIG.name}`,
    description:
      "Explore all product categories at GirlyHub. Discover stylish hair accessories, Korean clips, scrunchies, earrings, and fashion jewellery.",
    url: `${SITE_CONFIG.url}/category`,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: "/girlyhub_logo_flower_transparent.png",
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} Categories`,
      },
    ],
  },
};

export default async function CategoryIndexPage() {
  const categories = await getSSRHomeCategories(100);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Categories", url: "/category" },
  ]);

  return (
    <div className="min-h-[70vh] px-4 py-6 sm:px-6 lg:px-8">
      <JsonLd data={breadcrumbSchema} />
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-1.5 flex-wrap">
        <BreadcrumbHome /> / <span className="text-black font-medium">Categories</span>
      </div>
      <StaggeringCategories
        limit={100}
        showViewAll={false}
        initialCategories={categories}
      />
    </div>
  );
}

