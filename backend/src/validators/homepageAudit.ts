import { z } from "zod";

export const getAuditLogsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.enum(["CREATE", "UPDATE", "DELETE", "REORDER", "SEED", "PUBLISH"]).optional(),
  sectionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Section ID").optional(),
  actorId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Actor ID").optional(),
});
