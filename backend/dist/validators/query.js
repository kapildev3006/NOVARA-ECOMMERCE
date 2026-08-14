"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryQuerySchema = exports.productQuerySchema = exports.paginationQuerySchema = void 0;
const zod_1 = require("zod");
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.productQuerySchema = exports.paginationQuerySchema.extend({
    search: zod_1.z.string().max(100).optional(),
    category: zod_1.z.string().max(100).optional(),
    sort: zod_1.z.enum(["newest", "price_asc", "price_desc", "rating", "stock", "best_seller"]).default("newest"),
    minPrice: zod_1.z.coerce.number().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().min(0).optional(),
});
exports.categoryQuerySchema = exports.paginationQuerySchema.extend({
    search: zod_1.z.string().max(100).optional(),
    sort: zod_1.z.enum(["name_asc", "name_desc"]).default("name_asc"),
});
