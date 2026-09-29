import type { Metadata } from "next";
import NewArrivals from "@/components/NewArrivals";
import Link from "next/link";
import React from "react";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import JsonLd from "@/components/seo/JsonLd";
import FloralAccent from "@/components/decorations/FloralAccent";
import { SITE_CONFIG } from "@/lib/seo/config";
import { generateBreadcrumbSchema } from "@/lib/seo/schema";
import { getSSRProducts } from "@/lib/ssrData";
import { HiOutlineSparkles } from "react-icons/hi";
import { Sparkles, Heart, ShieldCheck, Truck, Flame } from "lucide-react";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "New Arrivals: Hair Accessories",
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
    <main className="min-h-[75vh] bg-[#fffafb] relative overflow-hidden py-6 sm:py-10">
      {/* Background ambient florals */}
      <div className="pointer-events-none absolute right-[-25px] top-24 hidden opacity-25 lg:block select-none">
        <FloralAccent flower={1} size="xl" animation="float" />
      </div>
      <div className="pointer-events-none absolute left-[-20px] bottom-32 hidden opacity-20 lg:block select-none">
        <FloralAccent flower={2} size="lg" animation="sway" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <JsonLd data={breadcrumbSchema} />

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
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
          <span className="font-semibold text-neutral-900 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/50">
            New Arrivals
          </span>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#8a3348] shadow-2xs backdrop-blur-xs mb-3">
            <Flame className="size-3.5 text-pink-500" />
            <span>Fresh Drops • Just Arrived</span>
            <HiOutlineSparkles className="size-3.5 text-pink-500" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-[#4e1a27] font-cormorant tracking-[0.01em] leading-tight">
            New In: The Latest Sparkle
          </h1>

          <p className="mt-3 font-cormorant italic text-lg sm:text-xl text-[#874b5c] font-light">
            &ldquo;Be the first to wear this season&apos;s most coveted Korean accessories.&rdquo;
          </p>

          <p className="mt-4 text-xs sm:text-sm md:text-base text-gray-600 max-w-xl mx-auto leading-relaxed font-sans">
            Freshly curated pieces designed for your everyday sparkle. From viral oversized claws to tarnish-resistant dainty pendants.
          </p>

          {/* Quick Quality Strip */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-[#532431]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-rose-200/60 px-3 py-1 shadow-2xs">
              <Sparkles className="size-3 text-pink-500" />
              <span>Weekly Fresh Drops</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-rose-200/60 px-3 py-1 shadow-2xs">
              <Heart className="size-3 text-rose-500 fill-rose-500" />
              <span>Handpicked Limited Batches</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-rose-200/60 px-3 py-1 shadow-2xs">
              <Truck className="size-3 text-[#8a3348]" />
              <span>Cash on Delivery Available</span>
            </span>
          </div>
        </div>

        {/* Product Grid */}
        <NewArrivals limit={100} initialProducts={products} />
      </div>
    </main>
  );
}
