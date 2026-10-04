import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Shop Categories",
  alternates: {
    canonical: `${SITE_CONFIG.url}/categories`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function CategoryIndexPage() {
  redirect("/categories");
}
