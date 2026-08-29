import type { Metadata } from "next";
import { Poppins } from "next/font/google";
// import "../globals.css";
import "./globals.css";
import HeaderSection from "@/components/HeaderSection";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";
import ScrollToTop from "@/components/ScrollToTop";
import AnnouncementBand from "@/components/AnnouncementBand";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GirlyHub | Trendy Accessories, Scrunchies & Dresses",
    template: "%s | GirlyHub",
  },
  description:
    "GirlyHub is your go-to destination for high-quality accessories, scrunchies, earrings, jewellery, flats, and dresses. Shop our curated collection and express your style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased custom-scrollbar `}
      >
        <AnnouncementBand />
        <ScrollToTop />
        {/* <Header /> */}
        <HeaderSection />

        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
