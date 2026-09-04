import type { Metadata } from "next";
import {
  Instrument_Serif,
  Poppins,
  Bodoni_Moda,
  Prata,
} from "next/font/google";
// import "../globals.css";
import "./globals.css";
import HeaderSection from "@/components/HeaderSection";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";
import ScrollToTop from "@/components/ScrollToTop";
import AnnouncementBand from "@/components/AnnouncementBand";
import { SpeedInsights } from "@vercel/speed-insights/react";

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

const prata = Prata({
  variable: "--font-prata",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://girlyhub.in"),
  title: {
    default: "GirlyHub | Trendy Accessories, Scrunchies & Dresses",
    template: "%s | GirlyHub",
  },
  description:
    "GirlyHub is your go-to destination for high-quality accessories, scrunchies, earrings, jewellery, flats, and dresses. Shop our curated collection and express your style.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "GirlyHub",
    title: "GirlyHub | Trendy Accessories, Scrunchies & Dresses",
    description:
      "Shop curated accessories, jewellery, scrunchies, flats, dresses, and more at GirlyHub.",
    url: "https://girlyhub.in",
  },
  twitter: {
    card: "summary_large_image",
    title: "GirlyHub | Trendy Accessories, Scrunchies & Dresses",
    description:
      "Shop curated accessories, jewellery, scrunchies, flats, dresses, and more at GirlyHub.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${bodoniModa.variable} ${prata.variable} ${instrumentSerif.variable} antialiased custom-scrollbar `}
      >
        <AnnouncementBand />
        <ScrollToTop />
        {/* <Header /> */}
        <HeaderSection />

        {children}
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "OnlineStore",
              name: "GirlyHub",
              url: "https://girlyhub.in",
              description: metadata.description,
              potentialAction: {
                "@type": "SearchAction",
                target: "https://girlyhub.in/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
