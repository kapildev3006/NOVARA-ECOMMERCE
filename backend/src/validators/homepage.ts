import { z } from "zod";

export const createSectionSchema = z.object({
  sectionKey: z.string().min(1).max(100),
  type: z.string().min(1).max(50),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(200).optional(),
  enabled: z.boolean().default(true),
  order: z.number().int().min(0).max(9999),
  config: z.record(z.string(), z.any()).or(z.array(z.any())).optional(),
});

export const updateSectionSchema = z.object({
  title: z.string().max(200).optional(),
  subtitle: z.string().max(200).optional(),
  enabled: z.boolean().optional(),
  order: z.number().int().min(0).max(9999).optional(),
  config: z.record(z.string(), z.any()).or(z.array(z.any())).optional(),
});

export const reorderSectionsSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Section ID"),
      order: z.number().int().min(0).max(9999),
    })
  ).min(1),
});
