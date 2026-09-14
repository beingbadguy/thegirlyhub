import type { Metadata } from "next";
import ContactClient from "./ContactClient";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_CONFIG } from "@/lib/seo/config";
import { generateBreadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Contact Us | Customer Support & Assistance",
  description:
    "Get in touch with GirlyHub. Contact us for questions about your order, shipping, returns, or product inquiries. We're here to help!",
  alternates: {
    canonical: `${SITE_CONFIG.url}/contact`,
  },
  openGraph: {
    title: `Contact Us | ${SITE_CONFIG.name}`,
    description:
      "Get in touch with GirlyHub. Contact us for questions about your order, shipping, returns, or product inquiries.",
    url: `${SITE_CONFIG.url}/contact`,
    siteName: SITE_CONFIG.name,
  },
};

export default function ContactPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Contact Us", url: "/contact" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <ContactClient />
    </>
  );
}
