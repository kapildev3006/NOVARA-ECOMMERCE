"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderSectionsSchema = exports.updateSectionSchema = exports.createSectionSchema = void 0;
const zod_1 = require("zod");
exports.createSectionSchema = zod_1.z.object({
    sectionKey: zod_1.z.string().min(1).max(100),
    type: zod_1.z.string().min(1).max(50),
    title: zod_1.z.string().max(200).optional(),
    subtitle: zod_1.z.string().max(200).optional(),
    enabled: zod_1.z.boolean().default(true),
    order: zod_1.z.number().int().min(0).max(9999),
    config: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).or(zod_1.z.array(zod_1.z.any())).optional(),
});
exports.updateSectionSchema = zod_1.z.object({
    title: zod_1.z.string().max(200).optional(),
    subtitle: zod_1.z.string().max(200).optional(),
    enabled: zod_1.z.boolean().optional(),
    order: zod_1.z.number().int().min(0).max(9999).optional(),
    config: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).or(zod_1.z.array(zod_1.z.any())).optional(),
});
exports.reorderSectionsSchema = zod_1.z.object({
    sections: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Section ID"),
        order: zod_1.z.number().int().min(0).max(9999),
    })).min(1),
});
