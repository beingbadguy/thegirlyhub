import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Products",
  description:
    "Browse GirlyHub's collection of jewellery, accessories, scrunchies, flats, dresses, and more.",
};

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
