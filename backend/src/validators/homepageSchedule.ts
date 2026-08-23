import { z } from "zod";

export const schedulePublishSchema = z.object({
  revisionId: z.number().int().positive(),
  publishAt: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date.getTime() > Date.now();
  }, { message: "publishAt must be a valid ISO string in the future" }),
});
