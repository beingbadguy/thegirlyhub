import type { Metadata } from "next";
import TrackClient from "./TrackClient";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_CONFIG } from "@/lib/seo/config";
import { generateBreadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Track your GirlyHub parcel in real-time. Enter your 24-character order ID to see live dispatch, shipping status, and courier tracking details across India.",
  alternates: {
    canonical: `${SITE_CONFIG.url}/track`,
  },
  openGraph: {
    title: `Track Your Order | ${SITE_CONFIG.name}`,
    description:
      "Track your GirlyHub parcel in real-time. Follow your accessories from our packing studio right to your doorstep.",
    url: `${SITE_CONFIG.url}/track`,
    siteName: SITE_CONFIG.name,
    images: [SITE_CONFIG.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `Track Your Order | ${SITE_CONFIG.name}`,
    description:
      "Track your GirlyHub parcel in real-time with live courier updates.",
    images: [SITE_CONFIG.ogImage],
  },
};

export default function TrackOrderPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Track Order", url: "/track" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <TrackClient />
    </>
  );
}
