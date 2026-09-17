import mongoose from "mongoose";

/** Convert a product title into a URL-safe slug */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Build a unique slug from title + id suffix */
export function buildProductSlug(title: string, id?: string): string {
  const base = slugify(title) || "product";
  const suffix = id ? id.slice(-6) : Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

/** Generate a unique collision-free slug by checking database */
export async function generateUniqueSlug(
  model: mongoose.Model<any>,
  title: string,
  currentId?: string
): Promise<string> {
  const baseSlug = slugify(title) || "product";
  let slug = baseSlug;
  let counter = 1;

  while (counter < 100) {
    const query: any = { slug };
    if (currentId) {
      query._id = { $ne: currentId };
    }
    const existing = await model.findOne(query).select("_id").lean();
    if (!existing) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return `${baseSlug}-${Date.now().toString().slice(-4)}`;
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
  if (!slug) return null;
  const match = slug.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}
