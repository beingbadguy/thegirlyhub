import Faqs from "@/components/Faqs";
import HomeAdSlots from "@/components/HomeAdSlots";
import NewArrivals from "@/components/NewArrivals";
import Newsletter from "@/components/Newsletter";
import ShopByCategory from "@/components/ShopByCategory";
import CountVisitor from "@/components/CountVisitor";
import HeroBannerSlider from "@/components/HeroBannerSlider";

import StaggeringCategories from "@/components/StaggeringCategories";
import TrustStrip from "@/components/TrustStrip";
import SummerSaleBanner from "@/components/SummerSaleBanner";
import HomeReviews from "@/components/HomeReviews";
import OfferBanner from "@/components/OfferBanner";

export default function Home() {
  return (
    <main className="mx-auto px-4 md:px-6">
      <div>
        <StaggeringCategories />
        <HeroBannerSlider />
        <ShopByCategory limit={12} showSeeMore />
        <HomeAdSlots />
        <OfferBanner />
        <NewArrivals limit={12} showSeeMore />
        <TrustStrip />
        <HomeReviews />
        {/* <SummerSaleBanner/> */}
        <Newsletter />
        <Faqs />
        <CountVisitor />
      </div>
    </main>
  );
}
