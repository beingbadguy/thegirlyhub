import { z } from "zod";

export const categoryEnum = z.string().optional().default("jewellery");

const optionalCoerceNumber = (defaultValue = 0) =>
  z.preprocess((val) => {
    if (val === undefined || val === null || val === "") return defaultValue;
    const num = Number(val);
    return isNaN(num) ? defaultValue : num;
  }, z.number().min(0).default(defaultValue));

// Base schema without refinements so .partial() can be used safely
export const productBaseSchema = z.object({
  title: z.string().max(150).optional(),
  name: z.string().max(150).optional(),
  slug: z.string().optional(),
  description: z.string().optional().default(""),
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
  price: optionalCoerceNumber(0),
  costPrice: optionalCoerceNumber(0).optional(),
  sellingPrice: optionalCoerceNumber(0).optional(),
  currency: z.string().optional().default("INR"),
  discountPrice: optionalCoerceNumber(0).optional(),
  discountedPrice: optionalCoerceNumber(0).optional(),
  category: z.string().optional().default("jewellery"),
  images: z.array(z.string()).optional().default([]),
  mainImage: z.string().optional(),
  video: z.string().optional(),
  stock: optionalCoerceNumber(0),
  totalStock: optionalCoerceNumber(0).optional(),
  lowStockThreshold: optionalCoerceNumber(10).optional(),
  trackInventory: z.boolean().optional(),
  isFeatured: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(false),
  status: z
    .enum([
      "draft",
      "active",
      "featured",
      "new_arrival",
      "out_of_stock",
      "archived",
    ])
    .optional()
    .default("draft"),
  isActive: z.boolean().optional(),
  weight: optionalCoerceNumber(0).optional(),
  length: optionalCoerceNumber(0).optional(),
  breadth: optionalCoerceNumber(0).optional(),
  height: optionalCoerceNumber(0).optional(),
  info: z.string().optional(),
});

// Create validation: name or title required
export const productCreateSchema = productBaseSchema
  .refine(
    (data) =>
      Boolean((data.title && data.title.trim()) || (data.name && data.name.trim())),
    {
      message: "Product name or title is required",
      path: ["name"],
    },
  )
  .refine(
    (data) => {
      if (
        data.discountPrice !== undefined &&
        data.price !== undefined &&
        data.price > 0 &&
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

// Update validation (all fields optional)
export const productUpdateSchema = productBaseSchema.partial().refine(
  (data) => {
    if (
      data.discountPrice !== undefined &&
      data.price !== undefined &&
      data.price > 0 &&
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

