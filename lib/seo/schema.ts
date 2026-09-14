import { SITE_CONFIG } from "./config";

/**
 * Organization & OnlineStore Structured Data
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.name,
    legalName: SITE_CONFIG.legalName,
    url: SITE_CONFIG.url,
    logo: {
      "@type": "ImageObject",
      url: SITE_CONFIG.logo,
      caption: `${SITE_CONFIG.name} Logo`,
    },
    image: SITE_CONFIG.ogImage,
    description: SITE_CONFIG.defaultDescription,
    telephone: SITE_CONFIG.contact.phone,
    email: SITE_CONFIG.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONFIG.contact.address.streetAddress,
      addressLocality: SITE_CONFIG.contact.address.addressLocality,
      addressRegion: SITE_CONFIG.contact.address.addressRegion,
      postalCode: SITE_CONFIG.contact.address.postalCode,
      addressCountry: SITE_CONFIG.contact.address.addressCountry,
    },
    priceRange: "₹₹",
    sameAs: Object.values(SITE_CONFIG.socials).filter(Boolean),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE_CONFIG.contact.phone,
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    },
  };
}

/**
 * WebSite & Sitelinks Searchbox Structured Data
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_CONFIG.url}/#website`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.defaultDescription,
    publisher: {
      "@id": `${SITE_CONFIG.url}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "en-IN",
  };
}

export interface ProductSchemaInput {
  _id?: string;
  name?: string;
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  description?: string;
  shortDescription?: string;
  longDescription?: string;
  slug?: string;
  images?: string[];
  image?: string;
  mainImage?: string;
  price?: number;
  sellingPrice?: number;
  discountPrice?: number;
  discountedPrice?: number;
  stock?: number;
  countInStock?: number;
  totalStock?: number;
  averageRating?: number;
  ratings?: number;
  rating?: number;
  totalReviews?: number;
  numReviews?: number;
  brand?: string;
  material?: string;
  category?: string;
  reviews?: Array<{
    username?: string;
    rating?: number;
    comment?: string;
    createdAt?: string | Date;
  }>;
}

/**
 * Google Rich Results Compatible Product Structured Data
 */
export function generateProductSchema(product: ProductSchemaInput, canonicalUrl: string) {
  const name = product.name || product.title || "GirlyHub Product";
  const rawDesc =
    product.metaDescription ||
    product.shortDescription ||
    product.description ||
    product.longDescription ||
    `Shop ${name} online at GirlyHub.`;
  const cleanDescription = rawDesc.replace(/<[^>]*>/g, "").trim().slice(0, 500);

  const images: string[] = [];
  if (Array.isArray(product.images) && product.images.length > 0) {
    product.images.forEach((img) => {
      if (img && typeof img === "string") {
        images.push(img.startsWith("http") ? img : `${SITE_CONFIG.url}${img.startsWith("/") ? "" : "/"}${img}`);
      }
    });
  }
  if (images.length === 0 && (product.image || product.mainImage)) {
    const singleImg = product.mainImage || product.image || "";
    images.push(singleImg.startsWith("http") ? singleImg : `${SITE_CONFIG.url}${singleImg.startsWith("/") ? "" : "/"}${singleImg}`);
  }
  if (images.length === 0) {
    images.push(SITE_CONFIG.ogImage);
  }

  const finalPrice =
    product.sellingPrice || product.discountPrice || product.discountedPrice || product.price || 0;
  const stock =
    product.totalStock !== undefined
      ? product.totalStock
      : product.stock !== undefined
      ? product.stock
      : product.countInStock || 0;
  const inStock = stock > 0;

  const ratingValue = product.averageRating || product.ratings || product.rating || 0;
  const reviewCount = product.totalReviews || product.numReviews || product.reviews?.length || 0;

  const sku = product._id ? String(product._id) : product.slug || "GH-PROD";

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    name,
    image: images,
    description: cleanDescription,
    sku,
    mpn: sku,
    brand: {
      "@type": "Brand",
      name: product.brand || SITE_CONFIG.name,
    },
    category: product.category || "Jewellery & Accessories",
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "INR",
      price: finalPrice.toFixed(2),
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: SITE_CONFIG.name,
      },
    },
  };

  // Only include aggregateRating if there are verified ratings/reviews
  if (ratingValue > 0 && reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: ratingValue.toFixed(1),
      reviewCount: reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  // Include user reviews if present
  if (Array.isArray(product.reviews) && product.reviews.length > 0) {
    schema.review = product.reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: r.username || "Verified Buyer",
      },
      datePublished: r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      reviewBody: (r.comment || "").replace(/<[^>]*>/g, "").slice(0, 500),
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating || 5,
        bestRating: "5",
        worstRating: "1",
      },
    }));
  }

  return schema;
}

/**
 * Breadcrumbs Structured Data
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_CONFIG.url}${item.url.startsWith("/") ? "" : "/"}${item.url}`,
    })),
  };
}

/**
 * FAQ Structured Data
 */
export function generateFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.replace(/<[^>]*>/g, ""),
      },
    })),
  };
}

/**
 * Collection / Category Structured Data
 */
export function generateCollectionSchema(title: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name: title,
    description: description.replace(/<[^>]*>/g, ""),
    url: url,
    isPartOf: {
      "@id": `${SITE_CONFIG.url}/#website`,
    },
  };
}
