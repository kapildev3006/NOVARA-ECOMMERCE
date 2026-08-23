import { MediaAsset } from "../models/MediaAsset";
import { Product } from "../models/Product";
import { Category } from "../models/Category";
import { z } from "zod";
import { recordQaMetric } from "../utils/homepageMetrics";

export interface HomepageValidationIssue {
  code: string;
  severity: "error" | "warning";
  sectionKey?: string;
  field?: string;
  message: string;
}

export interface HomepageValidationResult {
  valid: boolean;
  errors: HomepageValidationIssue[];
  warnings: HomepageValidationIssue[];
}

import { CANONICAL_HOMEPAGE_SECTIONS } from "../constants/homepage";

const PROTECTED_SECTIONS = CANONICAL_HOMEPAGE_SECTIONS.map(s => ({ sectionKey: s.sectionKey, type: s.type }));

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
const customConfigSchema = z.object({
  layout: z.enum(["image-left", "image-right", "full-width-banner"]).optional(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  image: z.object({
    assetKey: z.string()
  }).optional(),
  buttonText: z.string().max(100).optional(),
  buttonLink: z.string().max(500).optional(),
  backgroundColor: z.string().max(50).optional(),
  textColor: z.string().max(50).optional(),
  textAlign: z.enum(["left", "center"]).optional(),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional()
}).passthrough();

const carouselConfigSchema = z.object({
  source: z.enum(["deals", "new-arrivals", "best-sellers", "manual", "new", "bestsellers"]).optional(), // Include legacy names just in case
  productIds: z.array(z.string()).optional(),
  collection: z.string().optional() // from seed
}).passthrough();

const isSafeUrl = (url: string) => {
  try {
    // If it's a relative URL like "/products/xyz", it's fine
    if (url.startsWith("/")) return true;
    
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:" || parsed.protocol === "tel:";
  } catch (e) {
    return false; // Invalid URL structure
  }
};

export const validateHomepageRevision = async (revision: any): Promise<HomepageValidationResult> => {
  const errors: HomepageValidationIssue[] = [];
  const warnings: HomepageValidationIssue[] = [];

  const sections = revision.sections || [];
  
  // 1. Required Sections Validation
  // We'll enforce that all PREDEFINED_SECTIONS exist in the draft and have the correct type.
  const sectionKeys = new Set<string>();
  
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
    const sec = sections.find((s: any) => s.sectionKey === pref.sectionKey);
    if (!sec) {
      errors.push({
        code: "MISSING_REQUIRED_SECTION",
        severity: "error",
        sectionKey: pref.sectionKey,
        message: `Required protected section "${pref.sectionKey}" is missing.`
      });
    } else {
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
  const assetKeysToLookup = new Set<string>();
  const productIdsToLookup = new Set<string>();
  const categoryIdsToLookup = new Set<string>();

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
    } else if (sec.type === "product-carousel") {
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
    } else {
      // Collect references for batched lookups
      // 1. Assets
      if (config.image?.assetKey) {
        assetKeysToLookup.add(config.image.assetKey);
      }
      
      // 2. Products
      if (Array.isArray(config.productIds)) {
        config.productIds.forEach((pid: string) => productIdsToLookup.add(pid));
      }

      // 3. Categories
      if (Array.isArray(config.categoryIds)) {
        config.categoryIds.forEach((cid: string) => categoryIdsToLookup.add(cid));
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
    const assets = await MediaAsset.find({ assetKey: { $in: Array.from(assetKeysToLookup) } }).lean();
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
    const products = await Product.find({ _id: { $in: validObjectIds } }).lean();
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
    const categories = await Category.find({ _id: { $in: validObjectIds } }).lean();
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
    recordQaMetric(errors.length, warnings.length);
  } catch (e) {
    console.error("QA metric recording failed", e);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};
