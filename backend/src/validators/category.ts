import { z } from "zod";

const imageSchema = z.object({
  url: z.string(),
  publicId: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  format: z.string().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  image: imageSchema,
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();
