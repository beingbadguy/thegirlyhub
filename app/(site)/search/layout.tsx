import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Products",
  description:
    "Search GirlyHub's curated collection of accessories, jewellery, dresses, and more.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
