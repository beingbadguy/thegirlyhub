import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_CONFIG.url;

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/product/",
          "/category/",
          "/categories",
          "/newarrivals",
          "/about",
          "/contact",
          "/policies/",
          "/*.png",
          "/*.jpg",
          "/*.jpeg",
          "/*.webp",
          "/*.svg",
          "/*.ico",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/(dashboard)/",
          "/dashboard/",
          "/cart",
          "/checkout",
          "/profile",
          "/wishlist",
          "/login",
          "/signup",
          "/forget",
          "/reset",
          "/confirm",
          "/verify",
          "/track",
          "/success/",
          "/online-success",
          "/payment-error",
          "/*?*sort=",
          "/*?*maxPrice=",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/product/", "/category/"],
        disallow: ["/api/", "/admin/", "/cart", "/checkout", "/profile"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
