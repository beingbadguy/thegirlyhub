import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Arrivals",
  description:
    "Discover the latest jewellery, accessories, scrunchies, dresses, and more from GirlyHub.",
};

export default function NewArrivalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
