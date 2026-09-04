import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop By Category",
  description:
    "Explore GirlyHub products by category and discover accessories, jewellery, fashion, and everyday essentials.",
};

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
