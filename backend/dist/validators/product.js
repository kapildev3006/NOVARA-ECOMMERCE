"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStockSchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
const imageSchema = zod_1.z.object({
    url: zod_1.z.string(),
    publicId: zod_1.z.string().optional(),
    width: zod_1.z.number().optional(),
    height: zod_1.z.number().optional(),
    format: zod_1.z.string().optional(),
});
exports.createProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    slug: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1),
    category: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID"), // MongoDB ObjectId
    price: zod_1.z.number().positive(),
    originalPrice: zod_1.z.number().positive(),
    discount: zod_1.z.number().min(0).max(100).default(0),
    stock: zod_1.z.number().int().min(0).default(0),
    image: imageSchema,
    gallery: zod_1.z.array(imageSchema).optional(),
    isNew: zod_1.z.boolean().default(false),
    isBestSeller: zod_1.z.boolean().default(false),
    specifications: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
});
exports.updateProductSchema = exports.createProductSchema.partial();
exports.updateStockSchema = zod_1.z.object({
    stock: zod_1.z.number().int().min(0),
});
