import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const productQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "rating", "stock", "best_seller"]).default("newest"),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
});

export const categoryQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(100).optional(),
  sort: z.enum(["name_asc", "name_desc"]).default("name_asc"),
});
