import type { MetadataRoute } from "next";
import { databaseConnection } from "@/config/databseConnection";
import Product from "@/models/product.model";
import Category from "@/models/category.model";
import { buildProductSlug } from "@/lib/slug";
import { SITE_CONFIG } from "@/lib/seo/config";

export const revalidate = 3600; // Cache sitemap for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;

  // 1. Static Core Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/newarrivals`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/category`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/policies/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/policies/refund-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/policies/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/policies/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  try {
    await databaseConnection();

    // 2. Dynamic Categories
    const categories = await Category.find({
      isActive: { $ne: false },
      isDeleted: { $ne: true },
    })
      .select("name updatedAt")
      .lean();

    const categoryEntries: MetadataRoute.Sitemap = categories
      .filter((cat: any) => cat.name)
      .map((cat: any) => ({
        url: `${baseUrl}/category/${encodeURIComponent(cat.name)}`,
        lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
        changeFrequency: "daily" as const,
        priority: 0.85,
      }));

    // 3. Dynamic Products
    const products = await Product.find({
      isActive: { $ne: false },
      status: { $nin: ["draft", "archived"] },
    })
      .select("slug title name updatedAt _id")
      .lean();

    const productEntries: MetadataRoute.Sitemap = products.map((prod: any) => {
      const slug =
        prod.slug ||
        (prod.title || prod.name
          ? buildProductSlug(prod.title || prod.name, prod._id.toString())
          : prod._id.toString());

      return {
        url: `${baseUrl}/product/${encodeURIComponent(slug)}`,
        lastModified: prod.updatedAt ? new Date(prod.updatedAt) : new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      };
    });

    return [...staticRoutes, ...categoryEntries, ...productEntries];
  } catch (err) {
    console.error("Error generating sitemap:", err);
    return staticRoutes;
  }
}
