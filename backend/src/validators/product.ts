import { z } from "zod";

const imageSchema = z.object({
  url: z.string(),
  publicId: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  format: z.string().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(1),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID"), // MongoDB ObjectId
  price: z.number().positive(),
  originalPrice: z.number().positive(),
  discount: z.number().min(0).max(100).default(0),
  stock: z.number().int().min(0).default(0),
  image: imageSchema,
  gallery: z.array(imageSchema).optional(),
  isNew: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  specifications: z.record(z.string(), z.string()).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const updateStockSchema = z.object({
  stock: z.number().int().min(0),
});
