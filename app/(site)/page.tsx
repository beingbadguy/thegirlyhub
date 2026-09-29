import dynamic from "next/dynamic";
import HomeAdSlots from "@/components/HomeAdSlots";
import NewArrivals from "@/components/NewArrivals";
import CategoryProductSections from "@/components/CategoryProductSections";
import HeroBannerSlider from "@/components/HeroBannerSlider";
import BudgetPriceZone from "@/components/BudgetPriceZone";
import TrustStrip from "@/components/TrustStrip";
import HomeConnect from "@/components/HomeConnect";
import StaggeringCategories from "@/components/StaggeringCategories";
import InstagramShowcase from "@/components/InstagramShowcase";
import FloralAccent from "@/components/decorations/FloralAccent";
import {
  getSSRBanners,
  getSSRHomeCategories,
  getSSRProducts,
} from "@/lib/ssrData";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_CONFIG } from "@/lib/seo/config";

const OfferBanner = dynamic(() => import("@/components/OfferBanner"));
const OurStorySection = dynamic(() => import("@/components/OurStorySection"));
const HomeReviews = dynamic(() => import("@/components/HomeReviews"));
const Newsletter = dynamic(() => import("@/components/Newsletter"));
const Faqs = dynamic(() => import("@/components/Faqs"));
const CountVisitor = dynamic(() => import("@/components/CountVisitor"));

export const revalidate = 60; // Revalidate every 60 seconds (ISR hybrid)

export const metadata: Metadata = {
  title: { absolute: "Trendy Earrings @ ₹109 | GirlyHub" },
  description:
    "Shop trendy jewellery starting ₹109 😍 Free delivery + COD available. Limited stock ⚡",
  alternates: { canonical: SITE_CONFIG.url },
  openGraph: {
    title: "Trendy Earrings @ ₹109 | GirlyHub",
    description: "Free delivery + COD available. Shop now!",
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Trendy Earrings @ ₹109 | GirlyHub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trendy Earrings @ ₹109 | GirlyHub",
    description:
      "Shop trendy jewellery starting ₹109 😍 Free delivery + COD available. Limited stock ⚡",
    images: ["/og.png"],
  },
};

export default async function Home() {
  // Parallel fetch server-side datasets with lean projections
  const [banners, categories, newArrivalsRes, featuredRes, categoryProductsRes] =
    await Promise.all([
      getSSRBanners(),
      getSSRHomeCategories(12),
      getSSRProducts({ limit: 12 }),
      getSSRProducts({ limit: 12, featured: true }),
      getSSRProducts({ limit: 24 }),
    ]);

  return (
    <main className="w-full bg-[#fffafb] relative overflow-hidden">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${SITE_CONFIG.url}/#webpage`,
          name: SITE_CONFIG.defaultTitle,
          url: SITE_CONFIG.url,
          description: SITE_CONFIG.defaultDescription,
          isPartOf: { "@id": `${SITE_CONFIG.url}/#website` },
        }}
      />
      {/* Background ambient florals for cohesive luxury aesthetic */}
      <div className="pointer-events-none absolute right-[-30px] top-40 hidden opacity-25 lg:block select-none z-0">
        <FloralAccent flower={1} size="xl" animation="float" />
      </div>
      <div className="pointer-events-none absolute left-[-25px] top-[32%] hidden opacity-20 lg:block select-none z-0">
        <FloralAccent flower={3} size="lg" animation="sway" />
      </div>
      <div className="pointer-events-none absolute right-[-25px] top-[55%] hidden opacity-20 lg:block select-none z-0">
        <FloralAccent flower={2} size="xl" animation="float-delayed" />
      </div>
      <div className="pointer-events-none absolute left-[-30px] top-[78%] hidden opacity-20 lg:block select-none z-0">
        <FloralAccent flower={1} size="lg" animation="pulse" />
      </div>

      {/* Category Navigation Strip */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <StaggeringCategories initialCategories={categories} />
      </div>

      {/* Full Width Hero Banner - Pre-rendered on SSR for sub-second LCP & zero CLS */}
      <div className="w-full">
        <HeroBannerSlider initialBanners={banners} />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Server Component: Budget Boutique */}
        <BudgetPriceZone />

        {/* New Arrivals Grid */}
        <NewArrivals
          limit={12}
          showSeeMore
          initialProducts={newArrivalsRes.products}
        />

        {/* Featured Products Grid */}
        {featuredRes.products.length > 0 && (
          <NewArrivals
            limit={12}
            featured
            initialProducts={featuredRes.products}
          />
        )}

        {/* Server Component: Home Ad Slots */}
        <HomeAdSlots />

        {/* Server Component: Curated Category Sections */}
        <CategoryProductSections
          initialCategories={categories}
          initialProducts={categoryProductsRes.products}
        />

        {/* Dynamic Below-the-fold Offer Countdown */}
        <OfferBanner />

        {/* Server Component: Our Story Luxury Editorial */}
        <OurStorySection />

        {/* Server Component: Trust Strip */}
        <TrustStrip />

        {/* Dynamic Reviews */}
        <HomeReviews />

        {/* Server Component: Customer Connect */}
        <HomeConnect />

        {/* Dynamic Newsletter */}
        <Newsletter />

        {/* Dynamic FAQs */}
        <Faqs />

        {/* Server Component: Instagram Showcase */}
        <InstagramShowcase />

        {/* Visitor Tracker */}
        <CountVisitor />
      </div>
    </main>
  );
}
