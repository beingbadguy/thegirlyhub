import { z } from "zod";

export const categoryEnum = z.enum([
  "jewellery",
  "earrings",
  "necklace",
  "ring",
  "bracelet",
  "other",
  "scrunchies",
  "shoes",
  "flats",
  "dresses",
  "suits",
]);

const jewelleryVariantSchema = z.object({
  sku: z.string().min(1),
  attributes: z
    .object({
      color: z.string().optional(),
      size: z.string().optional(),
    })
    .optional(),
  price: z.number().min(0),
  discountedPrice: z.number().min(0),
  stock: z.number().int().min(0),
  images: z.array(z.string()).optional().default([]),
  weight: z.number().min(0).optional(),
});

const legacyVariantOptionsSchema = z.object({
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
});

// Base schema without refinements so .partial() can be used safely
export const productBaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  name: z.string().min(1).max(150).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().max(320).optional(),
  longDescription: z.string().optional(),
  subCategory: z.string().optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  material: z.string().optional(),
  plating: z.string().optional(),
  stoneType: z.string().optional(),
  color: z.string().optional(),
  occasion: z.string().optional(),
  style: z.string().optional(),
  gender: z.string().optional(),
  setType: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
  costPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  currency: z.literal("INR").optional(),
  discountPrice: z
    .number()
    .min(0, "Discount price must be a positive number")
    .optional(),
  category: categoryEnum,
  images: z.array(z.string()).min(1, "At least one image is required"),
  mainImage: z.string().optional(),
  video: z.string().optional(),
  stock: z.number().int().min(0, "Stock must be a non-negative integer"),
  totalStock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  trackInventory: z.boolean().optional(),
  isFeatured: z.boolean().optional().default(false),
  variants: z
    .union([z.array(jewelleryVariantSchema), legacyVariantOptionsSchema])
    .optional()
    .default([]),
  weight: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  breadth: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  info: z.string().optional(),
});

// Create validation (adds price check refinement)
export const productCreateSchema = productBaseSchema.refine(
  (data) => {
    if (data.discountPrice !== undefined && data.discountPrice > data.price) {
      return false;
    }
    return true;
  },
  {
    message: "Discount price cannot be greater than regular price",
    path: ["discountPrice"],
  },
);

// Update validation (calls .partial() on the base schema, then adds price check refinement)
export const productUpdateSchema = productBaseSchema.partial().refine(
  (data) => {
    if (
      data.discountPrice !== undefined &&
      data.price !== undefined &&
      data.discountPrice > data.price
    ) {
      return false;
    }
    return true;
  },
  {
    message: "Discount price cannot be greater than regular price",
    path: ["discountPrice"],
  },
);
