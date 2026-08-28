import { z } from "zod";

export const categoryEnum = z.enum([
  "jewellery",
  "earrings",
  "scrunchies",
  "shoes",
  "flats",
  "dresses",
  "suits",
]);

// Base schema without refinements so .partial() can be used safely
export const productBaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0, "Price must be a positive number"),
  discountPrice: z.number().min(0, "Discount price must be a positive number").optional(),
  category: categoryEnum,
  images: z.array(z.string()).min(1, "At least one image is required"),
  stock: z.number().int().min(0, "Stock must be a non-negative integer"),
  isFeatured: z.boolean().optional().default(false),
  variants: z.object({
    sizes: z.array(z.string()).optional().default([]),
    colors: z.array(z.string()).optional().default([]),
  }).optional().default({ sizes: [], colors: [] }),
  weight: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  breadth: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  info: z.string().optional(),
});

// Create validation (adds price check refinement)
export const productCreateSchema = productBaseSchema.refine(data => {
  if (data.discountPrice !== undefined && data.discountPrice > data.price) {
    return false;
  }
  return true;
}, {
  message: "Discount price cannot be greater than regular price",
  path: ["discountPrice"],
});

// Update validation (calls .partial() on the base schema, then adds price check refinement)
export const productUpdateSchema = productBaseSchema.partial().refine(data => {
  if (data.discountPrice !== undefined && data.price !== undefined && data.discountPrice > data.price) {
    return false;
  }
  return true;
}, {
  message: "Discount price cannot be greater than regular price",
  path: ["discountPrice"],
});
