import { buildProductSlug } from "@/lib/slug";

const productBooleanFields = new Set([
  "isFeatured",
  "isNewArrival",
  "trackInventory",
  "isActive",
]);

const productJsonFields = new Set(["tags", "variants", "dimensions"]);

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
  const images = Array.isArray(input.images)
    ? input.images.filter(Boolean)
    : input.image
      ? [input.image]
      : Array.isArray(source.images)
        ? source.images.filter(Boolean)
        : source.image
          ? [source.image]
          : [];
  const variants = Array.isArray(input.variants)
    ? input.variants
    : Array.isArray(source.variants)
      ? source.variants
      : [];
  const variantStock = variants.reduce(
    (total: number, variant: { stock?: number }) =>
      total + Number(variant.stock || 0),
    0,
  );
  const totalStock =
    variants.length > 0
      ? variantStock
      : Number(
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
  const status =
    input.status ??
    (input.isActive !== undefined
      ? input.isActive === false
        ? "draft"
        : "active"
      : (source.status ?? (source.isActive === false ? "draft" : "active")));

  return {
    ...input,
    name,
    title: name,
    slug:
      input.slug ||
      source.slug ||
      (existing?._id
        ? buildProductSlug(name, String(existing._id))
        : undefined),
    description,
    shortDescription:
      input.shortDescription ?? source.shortDescription ?? description,
    longDescription:
      input.longDescription ?? source.longDescription ?? description,
    mainImage: input.mainImage ?? source.mainImage ?? images[0] ?? "",
    image:
      input.mainImage ??
      input.image ??
      source.mainImage ??
      source.image ??
      images[0] ??
      "",
    images,
    price: listPrice,
    sellingPrice: finalPrice,
    discountedPrice: finalPrice,
    discountPrice: finalPrice,
    discountPercentage:
      listPrice > 0
        ? Math.max(0, ((listPrice - finalPrice) / listPrice) * 100)
        : 0,
    totalStock,
    stock: totalStock,
    countInStock: totalStock,
    status,
    tenantId: input.tenantId ?? source.tenantId ?? "girlyhub",
    isActive: status === "active" || status === "out_of_stock",
    isFeatured: input.isFeatured ?? Boolean(source.isFeatured),
    isNewArrival: input.isNewArrival ?? Boolean(source.isNewArrival),
  };
}
