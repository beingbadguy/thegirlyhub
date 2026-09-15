import type { Metadata } from "next";
import { Suspense } from "react";
import ProductsClient from "./ProductsClient";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_CONFIG } from "@/lib/seo/config";
import { generateBreadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Shop All Products | Hair Accessories, Jewellery & More",
  description:
    "Explore the complete catalog at GirlyHub. Find stylish hair clips, Korean claws, scrunchies, earrings, necklaces, and chic fashion accessories.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/product`,
  },
  openGraph: {
    title: `Shop All Products | ${SITE_CONFIG.name}`,
    description:
      "Explore the complete catalog at GirlyHub. Find stylish hair clips, Korean claws, scrunchies, earrings, necklaces, and chic fashion accessories.",
    url: `${SITE_CONFIG.url}/product`,
    siteName: SITE_CONFIG.name,
  },
};

export default function ProductsPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Products", url: "/product" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <Suspense fallback={<div className="min-h-screen bg-neutral-50/40" />}>
        <ProductsClient />
      </Suspense>
    </>
  );
}
