import Faqs from "@/components/Faqs";
import HomeAdSlots from "@/components/HomeAdSlots";
import NewArrivals from "@/components/NewArrivals";
import CategoryProductSections from "@/components/CategoryProductSections";
import Newsletter from "@/components/Newsletter";
import CountVisitor from "@/components/CountVisitor";
import HeroBannerSlider from "@/components/HeroBannerSlider";
import BudgetPriceZone from "@/components/BudgetPriceZone";
import TrustStrip from "@/components/TrustStrip";
import SummerSaleBanner from "@/components/SummerSaleBanner";
import HomeReviews from "@/components/HomeReviews";
import OfferBanner from "@/components/OfferBanner";
import HomeConnect from "@/components/HomeConnect";
import StaggeringCategories from "@/components/StaggeringCategories";
import InstagramShowcase from "@/components/InstagramShowcase";
import { getSSRHomeCategories, getSSRProducts } from "@/lib/ssrData";

export const revalidate = 60; // Revalidate every 60 seconds (ISR / SSR hybrid)

export default async function Home() {
  const [categories, newArrivalsRes, featuredRes, allProductsRes] =
    await Promise.all([
      getSSRHomeCategories(12),
      getSSRProducts({ limit: 12 }),
      getSSRProducts({ limit: 12, featured: true }),
      getSSRProducts({ limit: 100 }),
    ]);

  return (
    <main className="w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <StaggeringCategories initialCategories={categories} />
      </div>

      {/* Full Width Hero Banner across ALL screen sizes */}
      <div className="w-full">
        <HeroBannerSlider />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <BudgetPriceZone />
        <NewArrivals
          limit={12}
          showSeeMore
          initialProducts={newArrivalsRes.products}
        />
        {featuredRes.products.length > 0 && (
          <NewArrivals
            limit={12}
            featured
            initialProducts={featuredRes.products}
          />
        )}
        <HomeAdSlots />
        <CategoryProductSections
          initialCategories={categories}
          initialProducts={allProductsRes.products}
        />
        <OfferBanner />
        <TrustStrip />
        <HomeReviews />
        <HomeConnect />
        {/* <SummerSaleBanner/> */}
        <Newsletter />
        <Faqs />
        <InstagramShowcase />
        <CountVisitor />
      </div>
    </main>
  );
}

