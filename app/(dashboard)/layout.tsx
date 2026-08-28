import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "../globals.css";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
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
  title: "GirlyHub Admin",
  description: "GirlyHub store administration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${playfair.variable} antialiased`}>
        <ScrollToTop />
        <div className="flex min-h-screen items-start overflow-hidden">
          <div className="">
            <DashboardSidebar />
          </div>
          <div className="flex min-h-screen max-h-screen min-w-0 flex-1 flex-col overflow-y-scroll">
            <DashboardNavbar />
            <div className="min-h-0 flex-1">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
