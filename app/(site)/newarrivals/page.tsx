import type { Metadata } from "next";
import NewArrivals from "@/components/NewArrivals";
import Link from "next/link";
import React from "react";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_CONFIG } from "@/lib/seo/config";
import { generateBreadcrumbSchema } from "@/lib/seo/schema";
import { getSSRProducts } from "@/lib/ssrData";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "New Arrivals | Latest Hair Accessories & Jewellery",
  description:
    "Discover the freshest drops at GirlyHub. Explore trending hair claws, new earrings, bows, scrunchies, and aesthetic accessories just added to our collection.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/newarrivals`,
  },
  openGraph: {
    title: `New Arrivals | ${SITE_CONFIG.name}`,
    description:
      "Discover the freshest drops at GirlyHub. Explore trending hair claws, new earrings, bows, and scrunchies.",
    url: `${SITE_CONFIG.url}/newarrivals`,
    siteName: SITE_CONFIG.name,
  },
};

export default async function NewArrivalsPage() {
  const { products } = await getSSRProducts({ limit: 100 });
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "New Arrivals", url: "/newarrivals" },
  ]);

  return (
    <div className="min-h-[70vh] px-4 py-6 sm:px-6 lg:px-8">
      <JsonLd data={breadcrumbSchema} />
      <div className="text-sm text-gray-500 mb-4 flex items-center gap-1.5 flex-wrap">
        <BreadcrumbHome /> /{" "}
        <span className="cursor-pointer hover:text-pink-600">
          <Link href="/product">Products</Link>
        </span>{" "}
        <span>/</span>
        <span className="text-black font-medium"> New Arrivals</span>
      </div>
      <NewArrivals limit={100} initialProducts={products} />
    </div>
  );
}

