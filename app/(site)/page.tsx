import Faqs from "@/components/Faqs";
import HomeAdSlots from "@/components/HomeAdSlots";
import NewArrivals from "@/components/NewArrivals";
import CategoryProductSections from "@/components/CategoryProductSections";
import Newsletter from "@/components/Newsletter";
import CountVisitor from "@/components/CountVisitor";
import HeroBannerSlider from "@/components/HeroBannerSlider";

import TrustStrip from "@/components/TrustStrip";
import SummerSaleBanner from "@/components/SummerSaleBanner";
import HomeReviews from "@/components/HomeReviews";
import OfferBanner from "@/components/OfferBanner";
import HomeConnect from "@/components/HomeConnect";
import StaggeringCategories from "@/components/StaggeringCategories";

export default function Home() {
  return (
    <main className="mx-auto px-4 md:px-6">
      <div>
        <StaggeringCategories />
        <HeroBannerSlider />
        <NewArrivals limit={12} showSeeMore />
        <NewArrivals limit={12} featured />
        <CategoryProductSections />
        <HomeAdSlots />
        <OfferBanner />
        <TrustStrip />
        <HomeReviews />
        <HomeConnect />
        {/* <SummerSaleBanner/> */}
        <Newsletter />
        <Faqs />
        <CountVisitor />
      </div>
    </main>
  );
}
