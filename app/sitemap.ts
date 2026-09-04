import type { MetadataRoute } from "next";
import { databaseConnection } from "@/config/databseConnection";
import Product from "@/models/product.model";

const siteUrl = "https://girlyhub.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = [
    "",
    "/about",
    "/category",
    "/product",
    "/newarrivals",
    "/search",
    "/contact",
    "/policies/privacy-policy",
    "/policies/refund-policy",
    "/policies/shipping-policy",
    "/policies/terms-of-service",
  ];

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? ("daily" as const) : ("weekly" as const),
    priority: route === "" ? 1 : 0.7,
  }));

  try {
    await databaseConnection();
    const products = await Product.find({ isActive: { $ne: false } })
      .select("slug updatedAt")
      .lean();

    const productEntries = products
      .filter((product) => product.slug)
      .map((product) => ({
        url: `${siteUrl}/product/${product.slug}`,
        lastModified: product.updatedAt || new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

    return [...staticEntries, ...productEntries];
  } catch {
    return staticEntries;
  }
}
