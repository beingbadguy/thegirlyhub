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
import {
  getSSRBanners,
  getSSRHomeCategories,
  getSSRProducts,
} from "@/lib/ssrData";

// Dynamic imports for below-the-fold components to reduce initial critical JS bundle
const OfferBanner = dynamic(() => import("@/components/OfferBanner"));
const HomeReviews = dynamic(() => import("@/components/HomeReviews"));
const Newsletter = dynamic(() => import("@/components/Newsletter"));
const Faqs = dynamic(() => import("@/components/Faqs"));
const CountVisitor = dynamic(() => import("@/components/CountVisitor"));

export const revalidate = 60; // Revalidate every 60 seconds (ISR hybrid)

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
    <main className="w-full">
      {/* Category Navigation Strip */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
