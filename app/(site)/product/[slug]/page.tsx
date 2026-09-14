import { databaseConnection } from "@/config/databseConnection";
import { buildProductSlug, extractIdFromSlug, slugify } from "@/lib/slug";
import Product from "@/models/product.model";
import mongoose from "mongoose";
import ProductPageClient from "./ProductPageClient";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_CONFIG } from "@/lib/seo/config";
import {
  generateBreadcrumbSchema,
  generateProductSchema,
} from "@/lib/seo/schema";

interface LeanProduct {
  _id: mongoose.Types.ObjectId | string;
  title: string;
  name?: string;
  slug?: string;
  category: string;
  metaTitle?: string;
  metaDescription?: string;
  shortDescription?: string;
  description?: string;
  price?: number;
  sellingPrice?: number;
  discountPrice?: number;
  images?: string[];
  image?: string;
  mainImage?: string;
  brand?: string;
  material?: string;
  rating?: number;
  ratings?: number;
  averageRating?: number;
  numReviews?: number;
  totalReviews?: number;
  totalStock?: number;
  stock?: number;
  countInStock?: number;
  isActive?: boolean;
  status?: string;
  reviews?: any[];
  updatedAt?: string | Date;
}

async function findProductBySlugOrId(identifier: string) {
  const decoded = decodeURIComponent(identifier);

  if (mongoose.Types.ObjectId.isValid(decoded)) {
    const byId = await Product.findById(decoded).lean();
    if (byId) return byId as unknown as LeanProduct;
  }

  const bySlug = await Product.findOne({ slug: decoded }).lean();
  if (bySlug) return bySlug as unknown as LeanProduct;

  const idFromSlug = extractIdFromSlug(decoded);
  if (idFromSlug) {
    const byPartialId = await Product.findById(idFromSlug).lean();
    if (byPartialId) return byPartialId as unknown as LeanProduct;
  }

  const baseSlug = decoded.replace(/-[a-f0-9]{6}$/i, "");
  const products = (await Product.find({}).lean()) as unknown as LeanProduct[];
  return (
    products.find(
      (p) =>
        p.slug === decoded ||
        slugify(p.title || p.name || "") === baseSlug ||
        buildProductSlug(p.title || p.name || "", p._id.toString()) === decoded,
    ) ?? null
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await databaseConnection();
  const { slug } = await params;
  const product = await findProductBySlugOrId(slug);

  if (!product) {
    return {
      title: "Product Not Found | GirlyHub",
      description: "The requested product is not available.",
      robots: { index: false, follow: true },
    };
  }

  const titleText = product.metaTitle || product.title || product.name || "Product";
  const price =
    product.sellingPrice || product.discountPrice || product.price || 0;
  const canonicalUrl = `${SITE_CONFIG.url}/product/${encodeURIComponent(slug)}`;

  const rawDescription =
    product.metaDescription ||
    product.shortDescription ||
    product.description ||
    `Shop ${titleText} online at GirlyHub. Explore premium hair accessories and jewellery with fast shipping and Cash on Delivery.`;

  const cleanDescription = rawDescription
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, 160);

  const images: string[] = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    product.images.forEach((img) => {
      if (img) images.push(img.startsWith("http") ? img : `${SITE_CONFIG.url}${img.startsWith("/") ? "" : "/"}${img}`);
    });
  }
  if (images.length === 0 && (product.mainImage || product.image)) {
    const single = product.mainImage || product.image || "";
    if (single) images.push(single.startsWith("http") ? single : `${SITE_CONFIG.url}${single.startsWith("/") ? "" : "/"}${single}`);
  }
  if (images.length === 0) {
    images.push(SITE_CONFIG.ogImage);
  }

  return {
    title: `${titleText} | Buy Online at ₹${price} | ${SITE_CONFIG.name}`,
    description: cleanDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${titleText} | ${SITE_CONFIG.name}`,
      description: cleanDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      type: "website",
      images: images.map((url) => ({
        url,
        width: 800,
        height: 800,
        alt: titleText,
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: `${titleText} | ${SITE_CONFIG.name}`,
      description: cleanDescription,
      images,
    },
  };
}

async function getRecommendations(category: string, excludeId: string) {
  let recommendations = await Product.find({
    category,
    _id: { $ne: excludeId },
    isActive: { $ne: false },
  })
    .limit(4)
    .lean();

  if (recommendations.length < 4) {
    const needed = 4 - recommendations.length;
    const fallback = await Product.find({
      category: { $ne: category },
      _id: { $ne: excludeId },
      isActive: { $ne: false },
    })
      .limit(needed)
      .lean();
    recommendations = [...recommendations, ...fallback];
  }
  return recommendations;
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  await databaseConnection();

  const product = await findProductBySlugOrId(slug);
  if (!product) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-neutral-50">
        <p className="text-neutral-500 font-serif">Product not found</p>
      </div>
    );
  }

  // Serialize to avoid Next.js serialization warnings
  const plainProduct = JSON.parse(JSON.stringify(product));
  const canonicalUrl = `${SITE_CONFIG.url}/product/${encodeURIComponent(slug)}`;

  const recommendations = await getRecommendations(plainProduct.category, plainProduct._id);
  const plainRecommendations = JSON.parse(JSON.stringify(recommendations));

  const productSchema = generateProductSchema(plainProduct, canonicalUrl);
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Categories", url: "/category" },
    {
      name: plainProduct.category || "Jewellery",
      url: `/category/${encodeURIComponent(plainProduct.category || "jewellery")}`,
    },
    {
      name: plainProduct.title || plainProduct.name || "Product",
      url: `/product/${encodeURIComponent(slug)}`,
    },
  ]);

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbsSchema} />
      <ProductPageClient
        initialProduct={plainProduct}
        initialRecommendations={plainRecommendations}
        slug={slug}
      />
    </>
  );
}
