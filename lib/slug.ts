/** Convert a product title into a URL-safe slug */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Build a unique slug from title + id suffix */
export function buildProductSlug(title: string, id: string): string {
  return `${slugify(title)}-${id.slice(-6)}`;
}

/** Build the storefront product URL from title (and optional stored slug) */
export function productUrl(
  title: string,
  id?: string,
  slug?: string,
): string {
  const s = slug || (id ? buildProductSlug(title, id) : slugify(title));
  return `/product/${encodeURIComponent(s)}`;
}

/** Extract a MongoDB ObjectId from a slug like "pink-clip-674a1b2c3d4e5f6789012345" */
export function extractIdFromSlug(slug: string): string | null {
  const match = slug.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}
