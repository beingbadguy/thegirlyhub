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
    <div className="min-h-[70vh] bg-[#fffafb]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <JsonLd data={breadcrumbSchema} />
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <Link
            href="/product"
            className="hover:text-rose-600 transition-colors"
          >
            Products
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900">New Arrivals</span>
        </nav>
        <NewArrivals limit={100} initialProducts={products} />
      </div>
    </div>
  );
}

