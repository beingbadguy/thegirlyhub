import { databaseConnection } from "@/config/databseConnection";
import { buildProductSlug, extractIdFromSlug, slugify } from "@/lib/slug";
import Product from "@/models/product.model";
import mongoose from "mongoose";
import ProductPageClient from "./ProductPageClient";

interface LeanProduct {
  _id: mongoose.Types.ObjectId | string;
  title: string;
  slug?: string;
  category: string;
}

async function findProductBySlugOrId(identifier: string) {
  const decoded = decodeURIComponent(identifier);

  if (mongoose.Types.ObjectId.isValid(decoded)) {
    const byId = await Product.findById(decoded).lean();
    if (byId) return byId;
  }

  const bySlug = await Product.findOne({ slug: decoded }).lean();
  if (bySlug) return bySlug;

  const idFromSlug = extractIdFromSlug(decoded);
  if (idFromSlug) {
    const byPartialId = await Product.findById(idFromSlug).lean();
    if (byPartialId) return byPartialId;
  }

  const baseSlug = decoded.replace(/-[a-f0-9]{6}$/i, "");
  const products = (await Product.find({}).lean()) as unknown as LeanProduct[];
  return (
    products.find(
      (p) =>
        p.slug === decoded ||
        slugify(p.title) === baseSlug ||
        buildProductSlug(p.title, p._id.toString()) === decoded,
    ) ?? null
  );
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

  const recommendations = await getRecommendations(plainProduct.category, plainProduct._id);
  const plainRecommendations = JSON.parse(JSON.stringify(recommendations));

  return (
    <ProductPageClient
      initialProduct={plainProduct}
      initialRecommendations={plainRecommendations}
      slug={slug}
    />
  );
}
