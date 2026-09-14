import type { Metadata } from "next";
import { databaseConnection } from "@/config/databseConnection";
import Category from "@/models/category.model";
import CategoryPageClient from "./CategoryPageClient";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_CONFIG } from "@/lib/seo/config";
import {
  generateBreadcrumbSchema,
  generateCollectionSchema,
} from "@/lib/seo/schema";

interface CategoryPageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { name } = await params;
  const categoryName = decodeURIComponent(name);
  const canonicalUrl = `${SITE_CONFIG.url}/category/${encodeURIComponent(name)}`;

  let categoryDesc = `Discover the cutest ${categoryName} collection online at GirlyHub. Explore trending hair accessories, jewellery, and essentials with COD and fast delivery across India.`;

  try {
    await databaseConnection();
    const catDoc = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryName}$`, "i") },
      isActive: { $ne: false },
    })
      .select("description")
      .lean();

    if (catDoc && (catDoc as any).description) {
      categoryDesc = (catDoc as any).description;
    }
  } catch (err) {
    console.error("Error fetching category metadata:", err);
  }

  const title = `${categoryName} Collection | Buy ${categoryName} Online | ${SITE_CONFIG.name}`;

  return {
    title,
    description: categoryDesc.slice(0, 160),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: categoryDesc,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      type: "website",
      images: [
        {
          url: "/girlyhub_logo_flower_transparent.png",
          width: 1200,
          height: 630,
          alt: `${categoryName} - ${SITE_CONFIG.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: categoryDesc,
      images: ["/girlyhub_logo_flower_transparent.png"],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { name } = await params;
  const categoryName = decodeURIComponent(name);
  const canonicalUrl = `${SITE_CONFIG.url}/category/${encodeURIComponent(name)}`;

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Categories", url: "/category" },
    { name: categoryName, url: `/category/${encodeURIComponent(name)}` },
  ]);

  const collectionSchema = generateCollectionSchema(
    `${categoryName} Collection`,
    `Explore trending ${categoryName} products at ${SITE_CONFIG.name}.`,
    canonicalUrl
  );

  return (
    <>
      <JsonLd data={breadcrumbsSchema} />
      <JsonLd data={collectionSchema} />
      <CategoryPageClient categoryName={categoryName} />
    </>
  );
}
