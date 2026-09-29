import type { Metadata } from "next";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import StaggeringCategories from "@/components/StaggeringCategories";
import JsonLd from "@/components/seo/JsonLd";
import FloralAccent from "@/components/decorations/FloralAccent";
import { SITE_CONFIG } from "@/lib/seo/config";
import { generateBreadcrumbSchema } from "@/lib/seo/schema";
import { getSSRHomeCategories } from "@/lib/ssrData";
import { HiOutlineSparkles } from "react-icons/hi";
import { Sparkles, Heart, ShieldCheck, Truck } from "lucide-react";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Explore Categories",
  description:
    "Browse through GirlyHub's curated collections. From everyday Korean claw clips to anti-tarnish jewellery, satin scrunchies, and cute daily essentials.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/categories`,
  },
  openGraph: {
    title: `Categories | ${SITE_CONFIG.name}`,
    description:
      "Explore curated hair claws, dainty jewellery, scrunchies, and accessories across India with GirlyHub.",
    url: `${SITE_CONFIG.url}/categories`,
    siteName: SITE_CONFIG.name,
  },
};

export default async function CategoriesPage() {
  const categories = await getSSRHomeCategories(100);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Categories", url: "/categories" },
  ]);

  return (
    <main className="min-h-[75vh] bg-[#fffafb] relative overflow-hidden py-6 sm:py-10">
      {/* Background ambient florals */}
      <div className="pointer-events-none absolute right-[-25px] top-24 hidden opacity-25 lg:block select-none">
        <FloralAccent flower={1} size="xl" animation="float" />
      </div>
      <div className="pointer-events-none absolute left-[-20px] bottom-32 hidden opacity-20 lg:block select-none">
        <FloralAccent flower={3} size="lg" animation="sway" />
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
          <span className="font-semibold text-neutral-900 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/50">
            Categories
          </span>
        </nav>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#8a3348] shadow-2xs backdrop-blur-xs mb-3">
            <HiOutlineSparkles className="size-3.5 text-pink-500" />
            <span>The GirlyHub Wardrobe</span>
            <HiOutlineSparkles className="size-3.5 text-pink-500" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-[#4e1a27] font-cormorant tracking-[0.01em] leading-tight">
            Explore Curated Collections
          </h1>

          <p className="mt-3 font-cormorant italic text-lg sm:text-xl text-[#874b5c] font-light">
            &ldquo;From everyday effortless claws to hypoallergenic statement jewels.&rdquo;
          </p>

          <p className="mt-4 text-xs sm:text-sm md:text-base text-gray-600 max-w-xl mx-auto leading-relaxed font-sans">
            Every category is handpicked to bring you the latest Korean trends, gentle-on-hair engineering, and long-lasting sparkle.
          </p>

          {/* Quick Quality Strip */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-[#532431]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-rose-200/60 px-3 py-1 shadow-2xs">
              <Sparkles className="size-3 text-pink-500" />
              <span>500+ Trending Designs</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-rose-200/60 px-3 py-1 shadow-2xs">
              <ShieldCheck className="size-3 text-emerald-600" />
              <span>Skin & Hair Friendly</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-rose-200/60 px-3 py-1 shadow-2xs">
              <Truck className="size-3 text-[#8a3348]" />
              <span>Cash on Delivery Across India</span>
            </span>
          </div>
        </div>

        {/* Categories Strip */}
        <div className="bg-white/70 backdrop-blur-xs border border-rose-100/70 rounded-3xl p-4 sm:p-8 shadow-xs">
          <StaggeringCategories
            limit={100}
            showViewAll={false}
            initialCategories={categories}
          />
        </div>
      </div>
    </main>
  );
}
