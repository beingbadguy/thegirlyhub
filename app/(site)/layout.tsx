import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
// import "../globals.css";
import "./globals.css";
import HeaderSection from "@/components/HeaderSection";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";
import ScrollToTop from "@/components/ScrollToTop";

const dmSans = DM_Sans({
  variable: "--font-display-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display-serif",
  subsets: ["latin"],
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
        className={`${dmSans.variable} ${playfair.variable} antialiased custom-scrollbar `}
      >
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
