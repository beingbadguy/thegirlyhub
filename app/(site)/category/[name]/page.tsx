import { notFound } from "next/navigation";
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
import { getSSRProducts } from "@/lib/ssrData";

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { name } = await params;
  const categoryName = decodeURIComponent(name);
  const canonicalUrl = `${SITE_CONFIG.url}/category/${encodeURIComponent(name)}`;

  let categoryDesc = `Discover the cutest ${categoryName} collection online at GirlyHub. Explore trending hair accessories, jewellery, and essentials with fast delivery across India.`;

  try {
    await databaseConnection();
    const catDoc = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      isActive: { $ne: false },
      isDeleted: { $ne: true },
    })
      .select("description")
      .lean();

    if (catDoc && (catDoc as any).description) {
      categoryDesc = (catDoc as any).description;
    }
  } catch (err) {
    console.error("Error fetching category metadata:", err);
  }

  const title = `${categoryName.slice(0, 37)} Collection`;
  const description = categoryDesc.replace(/<[^>]*>/g, "").trim().slice(0, 155);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
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
      description,
      images: ["/girlyhub_logo_flower_transparent.png"],
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { name } = await params;
  const categoryName = decodeURIComponent(name);
  const canonicalUrl = `${SITE_CONFIG.url}/category/${encodeURIComponent(name)}`;

  await databaseConnection();
  const categoryDoc = await Category.findOne({
    name: { $regex: new RegExp(`^${categoryName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    isActive: { $ne: false },
    isDeleted: { $ne: true },
  }).lean();

  if (!categoryDoc) {
    notFound();
  }

  const ssrResult = await getSSRProducts({ category: categoryName, limit: 12, page: 1 });

  // Direct category URL must respect visibility rules: zero-product categories cannot be accessed
  if (ssrResult.total === 0) {
    notFound();
  }

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Categories", url: "/categories" },
    { name: categoryName, url: `/category/${encodeURIComponent(name)}` },
  ]);

  const collectionSchema = generateCollectionSchema(
    `${categoryName} Collection`,
    `Explore trending ${categoryName} products at ${SITE_CONFIG.name}.`,
    canonicalUrl,
    ssrResult.products
  );

  return (
    <>
      <JsonLd data={breadcrumbsSchema} />
      <JsonLd data={collectionSchema} />
      <CategoryPageClient
        categoryName={categoryName}
        initialProducts={ssrResult.products}
        initialTotal={ssrResult.total}
        initialTotalPages={ssrResult.totalPages}
      />
    </>
  );
}

