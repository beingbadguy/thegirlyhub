import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/cart",
        "/checkout",
        "/profile",
        "/wishlist",
        "/login",
        "/signup",
      ],
    },
    sitemap: "https://girlyhub.in/sitemap.xml",
  };
}
