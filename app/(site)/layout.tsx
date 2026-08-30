import type { Metadata } from "next";
import { Poppins, Bodoni_Moda, Prata } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "GirlyHub | Trendy Accessories, Scrunchies & Dresses",
    template: "%s | GirlyHub",
  },
  description:
    "GirlyHub is your go-to destination for high-quality accessories, scrunchies, earrings, jewellery, flats, and dresses. Shop our curated collection and express your style.",
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
        className={`${poppins.variable} ${bodoniModa.variable} ${prata.variable} antialiased custom-scrollbar `}
      >
        <AnnouncementBand />
        <ScrollToTop />
        {/* <Header /> */}
        <HeaderSection />

        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
