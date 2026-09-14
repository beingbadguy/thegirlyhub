import type { Metadata, Viewport } from "next";
import {
  Darker_Grotesque,
  Instrument_Serif,
  Bodoni_Moda,
  Poppins,
} from "next/font/google";
import "./globals.css";
import HeaderSection from "@/components/HeaderSection";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";
import SmoothScroll from "@/components/SmoothScroll";
import AnnouncementBand from "@/components/AnnouncementBand";
import { SpeedInsights } from "@vercel/speed-insights/react";
import StickyMenuBar from "@/components/StickyMenuBar";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import CartDrawer from "@/components/CartDrawer";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_CONFIG } from "@/lib/seo/config";
import {
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/lib/seo/schema";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const darkerGrotesque = Darker_Grotesque({
  variable: "--font-darker-grotesque",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#ffe4e6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: SITE_CONFIG.defaultTitle,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.defaultDescription,
  keywords: SITE_CONFIG.defaultKeywords,
  authors: [{ name: SITE_CONFIG.name, url: SITE_CONFIG.url }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.defaultDescription,
    images: [
      {
        url: "/girlyhub_logo_flower_transparent.png",
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} - Trendy Jewellery & Accessories`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.defaultDescription,
    images: ["/girlyhub_logo_flower_transparent.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  },
  icons: {
    icon: [
      { url: "/favicon.png?v=4", type: "image/png" },
      { url: "/girlyhub-favicon.png", type: "image/png" },
    ],
    apple: [{ url: "/girlyhub-favicon.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();
  const webSiteSchema = generateWebSiteSchema();

  return (
    <html lang="en">
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={webSiteSchema} />
      </head>
      <body
        className={`${poppins.variable} ${bodoniModa.variable} ${instrumentSerif.variable} ${darkerGrotesque.variable} antialiased custom-scrollbar`}
      >
        <AnnouncementBand />
        <SmoothScroll />
        <HeaderSection />
        <StickyMenuBar />
        <FloatingWhatsApp />
        <CartDrawer />

        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

