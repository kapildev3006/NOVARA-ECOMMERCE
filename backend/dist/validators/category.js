"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
const imageSchema = zod_1.z.object({
    url: zod_1.z.string(),
    publicId: zod_1.z.string().optional(),
    width: zod_1.z.number().optional(),
    height: zod_1.z.number().optional(),
    format: zod_1.z.string().optional(),
});
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    slug: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    image: imageSchema,
    isActive: zod_1.z.boolean().default(true),
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
