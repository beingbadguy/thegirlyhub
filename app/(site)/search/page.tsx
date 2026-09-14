import type { Metadata } from "next";
import SearchClient from "./SearchClient";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Search Products",
  description: "Search for hair accessories, jewellery, scrunchies, and lifestyle products on GirlyHub.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: `${SITE_CONFIG.url}/search`,
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
