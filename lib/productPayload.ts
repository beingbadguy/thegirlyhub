import { buildProductSlug } from "@/lib/slug";

const productBooleanFields = new Set([
  "isFeatured",
  "isNewArrival",
  "trackInventory",
  "isActive",
]);

const productJsonFields = new Set(["dimensions", "tags", "variants", "sizes"]);

const productNumberFields = new Set([
  "costPrice",
  "sellingPrice",
  "price",
  "discountPrice",
  "discountedPrice",
  "discountPercentage",
  "totalStock",
  "stock",
  "countInStock",
  "lowStockThreshold",
  "weight",
  "length",
  "breadth",
  "height",
]);

export function productInputFromFormData(formData: FormData) {
  const input: Record<string, any> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    if (key === "images" || key === "image" || key === "existingImages")
      continue;

    if (productJsonFields.has(key)) {
      try {
        input[key] = JSON.parse(value);
      } catch {
        input[key] = value;
      }
    } else if (productBooleanFields.has(key)) {
      input[key] = value === "true" || value === "1";
    } else if (productNumberFields.has(key)) {
      const num = Number(value);
      input[key] = isNaN(num) ? 0 : num;
    } else {
      input[key] = value;
    }
  }

  return input;
}

export function normalizeProductPayload(
  input: Record<string, any>,
  existing?: Record<string, any>,
) {
  const source = { ...(existing || {}), ...input };
  const listPrice = Number(
    input.price ??
      input.sellingPrice ??
      source.price ??
      source.sellingPrice ??
      0,
  );
  const finalPrice = Number(
    input.discountPrice ??
      input.discountedPrice ??
      (input.price !== undefined ? input.sellingPrice : undefined) ??
      source.sellingPrice ??
      source.discountPrice ??
      source.discountedPrice ??
      listPrice,
  );
  const costPrice = Number(input.costPrice ?? source.costPrice ?? 0) || 0;
  const weight = Number(input.weight ?? source.weight ?? 0) || 0;
  const lowStockThreshold =
    Number(input.lowStockThreshold ?? source.lowStockThreshold ?? 10) || 10;
  const rawImages = Array.isArray(input.images)
    ? input.images.filter(Boolean)
    : input.image
      ? [input.image]
      : Array.isArray(source.images)
        ? source.images.filter(Boolean)
        : source.image
          ? [source.image]
          : [];
  const images = Array.from(new Set(rawImages.map((img: any) => String(img).trim()).filter(Boolean)));

  const totalStock = Number(
    input.totalStock ??
      input.stock ??
      input.countInStock ??
      source.totalStock ??
      source.stock ??
      source.countInStock ??
      0,
  );

  const name = input.name ?? input.title ?? source.name ?? source.title ?? "";
  const description =
    input.longDescription ??
    input.description ??
    input.shortDescription ??
    source.longDescription ??
    source.description ??
    source.shortDescription ??
    "";
  const category = (
    input.category ??
    source.category ??
    "jewellery"
  )
    .toString()
    .trim()
    .toLowerCase();

  const status =
    input.status ??
    (input.isActive !== undefined
      ? input.isActive === false
        ? "draft"
        : "active"
      : (source.status ?? (source.isActive === false ? "draft" : "active")));

  const rawTags = input.tags ?? source.tags ?? [];
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags.map((t: any) => String(t).trim()).filter(Boolean)
    : typeof rawTags === "string"
      ? rawTags
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [];

  const rawSizes = input.sizes ?? source.sizes ?? [];
  const sizes: string[] = Array.isArray(rawSizes)
    ? Array.from(new Set(rawSizes.map((s: any) => String(s).trim()).filter(Boolean)))
    : typeof rawSizes === "string"
      ? Array.from(
          new Set(
            rawSizes
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean),
          ),
        )
      : [];

  return {
    ...source,
    ...input,
    name,
    title: name,
    category,
    tags,
    sizes,
    slug:
      input.slug ||
      source.slug ||
      (existing?._id
        ? buildProductSlug(name || "product", String(existing._id))
        : undefined),
    description,
    shortDescription:
      input.shortDescription ?? source.shortDescription ?? description,
    longDescription:
      input.longDescription ?? source.longDescription ?? description,
    mainImage: input.mainImage ?? images[0] ?? "",
    image: input.mainImage ?? input.image ?? images[0] ?? "",
    images,
    costPrice,
    weight,
    lowStockThreshold,
    price: listPrice,
    sellingPrice: finalPrice,
    discountedPrice: finalPrice,
    discountPrice: finalPrice,
    discountPercentage:
      listPrice > 0 && listPrice > finalPrice
        ? Math.max(0, ((listPrice - finalPrice) / listPrice) * 100)
        : 0,
    totalStock,
    stock: totalStock,
    countInStock: totalStock,
    status,
    material:
      input.material !== undefined
        ? String(input.material).trim()
        : source.material
          ? String(source.material).trim()
          : "",
    isActive: status === "active" || status === "out_of_stock",
    isFeatured: input.isFeatured ?? Boolean(source.isFeatured),
    isNewArrival: input.isNewArrival ?? Boolean(source.isNewArrival),
  };
}


