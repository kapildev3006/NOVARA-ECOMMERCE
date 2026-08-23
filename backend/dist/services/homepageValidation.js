"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHomepageRevision = void 0;
const MediaAsset_1 = require("../models/MediaAsset");
const Product_1 = require("../models/Product");
const Category_1 = require("../models/Category");
const zod_1 = require("zod");
const homepageMetrics_1 = require("../utils/homepageMetrics");
const homepage_1 = require("../constants/homepage");
const PROTECTED_SECTIONS = homepage_1.CANONICAL_HOMEPAGE_SECTIONS.map(s => ({ sectionKey: s.sectionKey, type: s.type }));
const VALID_TYPES = [
    "announcement",
    "hero",
    "service-bar",
    "categories",
    "product-carousel",
    "promo-banner",
    "custom"
];
// Reusable config schemas for inner validation
const customConfigSchema = zod_1.z.object({
    layout: zod_1.z.enum(["image-left", "image-right", "full-width-banner"]).optional(),
    title: zod_1.z.string().max(200).optional(),
    subtitle: zod_1.z.string().max(200).optional(),
    description: zod_1.z.string().max(1000).optional(),
    image: zod_1.z.object({
        assetKey: zod_1.z.string()
    }).optional(),
    buttonText: zod_1.z.string().max(100).optional(),
    buttonLink: zod_1.z.string().max(500).optional(),
    backgroundColor: zod_1.z.string().max(50).optional(),
    textColor: zod_1.z.string().max(50).optional(),
    textAlign: zod_1.z.enum(["left", "center"]).optional(),
    productIds: zod_1.z.array(zod_1.z.string()).optional(),
    categoryIds: zod_1.z.array(zod_1.z.string()).optional()
}).passthrough();
const carouselConfigSchema = zod_1.z.object({
    source: zod_1.z.enum(["deals", "new-arrivals", "best-sellers", "manual", "new", "bestsellers"]).optional(), // Include legacy names just in case
    productIds: zod_1.z.array(zod_1.z.string()).optional(),
    collection: zod_1.z.string().optional() // from seed
}).passthrough();
const isSafeUrl = (url) => {
    try {
        // If it's a relative URL like "/products/xyz", it's fine
        if (url.startsWith("/"))
            return true;
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:" || parsed.protocol === "tel:";
    }
    catch (e) {
        return false; // Invalid URL structure
    }
};
const validateHomepageRevision = async (revision) => {
    const errors = [];
    const warnings = [];
    const sections = revision.sections || [];
    // 1. Required Sections Validation
    // We'll enforce that all PREDEFINED_SECTIONS exist in the draft and have the correct type.
    const sectionKeys = new Set();
    for (const s of sections) {
        if (sectionKeys.has(s.sectionKey)) {
            errors.push({
                code: "DUPLICATE_SECTION_KEY",
                severity: "error",
                sectionKey: s.sectionKey,
                message: `Duplicate section key found: ${s.sectionKey}`
            });
        }
        sectionKeys.add(s.sectionKey);
    }
    for (const pref of PROTECTED_SECTIONS) {
        const sec = sections.find((s) => s.sectionKey === pref.sectionKey);
        if (!sec) {
            errors.push({
                code: "MISSING_REQUIRED_SECTION",
                severity: "error",
                sectionKey: pref.sectionKey,
                message: `Required protected section "${pref.sectionKey}" is missing.`
            });
        }
        else {
            if (sec.type !== pref.type) {
                errors.push({
                    code: "PROTECTED_SECTION_INVALID",
                    severity: "error",
                    sectionKey: sec.sectionKey,
                    message: `Protected section "${sec.sectionKey}" must have type "${pref.type}".`
                });
            }
            if (!sec.isProtected) {
                errors.push({
                    code: "PROTECTED_SECTION_INVALID",
                    severity: "error",
                    sectionKey: sec.sectionKey,
                    message: `Protected section "${sec.sectionKey}" is missing isProtected flag.`
                });
            }
        }
    }
    // To batch queries
    const assetKeysToLookup = new Set();
    const productIdsToLookup = new Set();
    const categoryIdsToLookup = new Set();
    // 2. Section Loop Validation
    for (const sec of sections) {
        // Type validation
        if (!VALID_TYPES.includes(sec.type)) {
            errors.push({
                code: "INVALID_SECTION_TYPE",
                severity: "error",
                sectionKey: sec.sectionKey,
                message: `Unsupported section type: ${sec.type}`
            });
        }
        // Order validation
        if (typeof sec.order !== "number" || !Number.isInteger(sec.order) || sec.order < 0) {
            errors.push({
                code: "INVALID_ORDER",
                severity: "error",
                sectionKey: sec.sectionKey,
                field: "order",
                message: `Order must be a non-negative integer. Received: ${sec.order}`
            });
        }
        // Config validation
        const config = sec.config || {};
        let configResult;
        if (sec.type === "custom") {
            configResult = customConfigSchema.safeParse(config);
        }
        else if (sec.type === "product-carousel") {
            configResult = carouselConfigSchema.safeParse(config);
        }
        if (configResult && !configResult.success) {
            errors.push({
                code: "INVALID_SECTION_CONFIG",
                severity: "error",
                sectionKey: sec.sectionKey,
                field: "config",
                message: `Invalid configuration for type ${sec.type}.`
            });
        }
        else {
            // Collect references for batched lookups
            // 1. Assets
            if (config.image?.assetKey) {
                assetKeysToLookup.add(config.image.assetKey);
            }
            // 2. Products
            if (Array.isArray(config.productIds)) {
                config.productIds.forEach((pid) => productIdsToLookup.add(pid));
            }
            // 3. Categories
            if (Array.isArray(config.categoryIds)) {
                config.categoryIds.forEach((cid) => categoryIdsToLookup.add(cid));
            }
            // 4. URLs
            if (config.buttonLink) {
                if (!isSafeUrl(config.buttonLink)) {
                    errors.push({
                        code: "INVALID_URL",
                        severity: "error",
                        sectionKey: sec.sectionKey,
                        field: "config.buttonLink",
                        message: `Unsafe or invalid URL detected in buttonLink.`
                    });
                }
            }
        }
        // Warnings
        if (sec.type === "hero" || sec.type === "custom") {
            if (!config.title && !sec.title) {
                warnings.push({
                    code: "MISSING_OPTIONAL_TEXT",
                    severity: "warning",
                    sectionKey: sec.sectionKey,
                    message: "Title is missing. This section might look empty."
                });
            }
        }
    }
    // 3. Batched Lookups
    if (assetKeysToLookup.size > 0) {
        const assets = await MediaAsset_1.MediaAsset.find({ assetKey: { $in: Array.from(assetKeysToLookup) } }).lean();
        const foundAssetKeys = new Set(assets.map(a => a.assetKey));
        for (const sec of sections) {
            if (sec.config?.image?.assetKey && !foundAssetKeys.has(sec.config.image.assetKey)) {
                errors.push({
                    code: "MISSING_ASSET",
                    severity: "error",
                    sectionKey: sec.sectionKey,
                    field: "config.image.assetKey",
                    message: `Referenced media asset '${sec.config.image.assetKey}' was not found.`
                });
            }
        }
    }
    if (productIdsToLookup.size > 0) {
        // Validate that they are valid ObjectIds if needed, but MongoDB might fail if we pass invalid strings
        const validObjectIds = Array.from(productIdsToLookup).filter(id => /^[0-9a-fA-F]{24}$/.test(id));
        const products = await Product_1.Product.find({ _id: { $in: validObjectIds } }).lean();
        const foundProductIds = new Set(products.map(p => p._id.toString()));
        for (const sec of sections) {
            if (Array.isArray(sec.config?.productIds)) {
                for (const pid of sec.config.productIds) {
                    if (!foundProductIds.has(pid)) {
                        errors.push({
                            code: "MISSING_PRODUCT",
                            severity: "error",
                            sectionKey: sec.sectionKey,
                            field: "config.productIds",
                            message: `Referenced product '${pid}' was not found.`
                        });
                    }
                }
            }
        }
    }
    if (categoryIdsToLookup.size > 0) {
        const validObjectIds = Array.from(categoryIdsToLookup).filter(id => /^[0-9a-fA-F]{24}$/.test(id));
        const categories = await Category_1.Category.find({ _id: { $in: validObjectIds } }).lean();
        const foundCategoryIds = new Set(categories.map(c => c._id.toString()));
        for (const sec of sections) {
            if (Array.isArray(sec.config?.categoryIds)) {
                for (const cid of sec.config.categoryIds) {
                    if (!foundCategoryIds.has(cid)) {
                        errors.push({
                            code: "MISSING_CATEGORY",
                            severity: "error",
                            sectionKey: sec.sectionKey,
                            field: "config.categoryIds",
                            message: `Referenced category '${cid}' was not found.`
                        });
                    }
                }
            }
        }
    }
    try {
        (0, homepageMetrics_1.recordQaMetric)(errors.length, warnings.length);
    }
    catch (e) {
        console.error("QA metric recording failed", e);
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
};
exports.validateHomepageRevision = validateHomepageRevision;
