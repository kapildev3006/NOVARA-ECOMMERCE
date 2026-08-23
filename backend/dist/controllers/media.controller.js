"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMedia = exports.getMediaUsage = exports.updateMediaMetadata = exports.getMediaDetail = exports.listMedia = exports.uploadMedia = exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const cloudinary_1 = require("../utils/cloudinary");
const MediaAsset_1 = require("../models/MediaAsset");
const HomepageSection_1 = require("../models/HomepageSection");
const HomepageRevision_1 = require("../models/HomepageRevision");
const HomepageCampaign_1 = require("../models/HomepageCampaign");
const audit_1 = require("../utils/audit");
const homepageMetrics_1 = require("../utils/homepageMetrics");
// Configure Multer
const storage = multer_1.default.memoryStorage();
exports.uploadMiddleware = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Invalid file type"));
        }
    },
}).single("file");
// Helpers for usage detection
const findAssetUsage = async (assetKey) => {
    // We assume the assetKey is stored under config.image.assetKey in section configurations
    const query = { "sections.config.image.assetKey": assetKey };
    // 1. Live Sections
    const liveSections = await HomepageSection_1.HomepageSection.find({ "config.image.assetKey": assetKey }).lean();
    // 2. Revisions (draft, scheduled, published, executing, cancelled)
    const revisions = await HomepageRevision_1.HomepageRevision.find(query).select("revisionId status").lean();
    // 3. Campaigns
    const campaigns = await HomepageCampaign_1.HomepageCampaign.find({
        $or: [
            { "sections.config.image.assetKey": assetKey },
            { "fallbackRevisionId": { $in: revisions.map((r) => r.revisionId) } } // Or just check if any revision has it
        ]
    }).select("campaignKey").lean();
    const usage = {
        live: liveSections.length > 0,
        draft: revisions.some((r) => r.status === "draft"),
        revisions: revisions.map((r) => r.revisionId),
        campaigns: campaigns.map((c) => c.campaignKey),
    };
    return usage;
};
const uploadMedia = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "No file uploaded" } });
    }
    try {
        const buffer = req.file.buffer;
        const result = await (0, cloudinary_1.uploadImageToCloudinary)(buffer, "novara/homepage");
        const newAsset = await MediaAsset_1.MediaAsset.create({
            assetKey: `asset_${(0, uuid_1.v4)().replace(/-/g, "")}`,
            provider: "cloudinary",
            publicId: result.public_id,
            url: result.secure_url || result.url,
            secureUrl: result.secure_url,
            resourceType: result.resource_type,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            uploadedBy: req.user?.userId,
        });
        await (0, audit_1.logHomepageMutation)({
            req,
            action: "MEDIA_UPLOAD",
            details: { assetKey: newAsset.assetKey, publicId: newAsset.publicId },
        });
        (0, homepageMetrics_1.recordMediaMetric)("upload", false, result.bytes);
        res.status(201).json({ success: true, asset: newAsset });
    }
    catch (error) {
        (0, homepageMetrics_1.recordMediaMetric)("upload", true);
        (0, homepageMetrics_1.recordErrorMetric)("cloudinary_error");
        console.error("uploadMedia error:", error);
        res.status(500).json({ success: false, error: { code: "UPLOAD_FAILED", message: "Failed to upload image" } });
    }
};
exports.uploadMedia = uploadMedia;
const listMedia = async (req, res) => {
    try {
        const pageParam = typeof req.query.page === "string" ? req.query.page : "1";
        const limitParam = typeof req.query.limit === "string" ? req.query.limit : "20";
        const page = parseInt(pageParam, 10);
        const limit = parseInt(limitParam, 10);
        const skip = (page - 1) * limit;
        const [assets, total] = await Promise.all([
            MediaAsset_1.MediaAsset.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            MediaAsset_1.MediaAsset.countDocuments(),
        ]);
        res.status(200).json({
            success: true,
            assets,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error("listMedia error:", error);
        res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to list media" } });
    }
};
exports.listMedia = listMedia;
const getMediaDetail = async (req, res) => {
    try {
        const { assetKey } = req.params;
        const asset = await MediaAsset_1.MediaAsset.findOne({ assetKey }).lean();
        if (!asset) {
            return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Asset not found" } });
        }
        res.status(200).json({ success: true, asset });
    }
    catch (error) {
        console.error("getMediaDetail error:", error);
        res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to get media details" } });
    }
};
exports.getMediaDetail = getMediaDetail;
const updateMediaMetadata = async (req, res) => {
    try {
        const { assetKey } = req.params;
        const { altText, caption, tags, folder } = req.body;
        const asset = await MediaAsset_1.MediaAsset.findOne({ assetKey });
        if (!asset) {
            return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Asset not found" } });
        }
        if (altText !== undefined)
            asset.altText = altText;
        if (caption !== undefined)
            asset.caption = caption;
        if (tags !== undefined)
            asset.tags = tags;
        if (folder !== undefined)
            asset.folder = folder;
        await asset.save();
        await (0, audit_1.logHomepageMutation)({
            req,
            action: "MEDIA_UPDATE",
            details: { assetKey: asset.assetKey },
        });
        (0, homepageMetrics_1.recordMediaMetric)("update", false);
        res.status(200).json({ success: true, asset });
    }
    catch (error) {
        (0, homepageMetrics_1.recordMediaMetric)("update", true);
        (0, homepageMetrics_1.recordErrorMetric)("database_error");
        console.error("updateMediaMetadata error:", error);
        res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update media" } });
    }
};
exports.updateMediaMetadata = updateMediaMetadata;
const getMediaUsage = async (req, res) => {
    try {
        const { assetKey } = req.params;
        const usage = await findAssetUsage(assetKey);
        res.status(200).json({ success: true, usage });
    }
    catch (error) {
        console.error("getMediaUsage error:", error);
        res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to check media usage" } });
    }
};
exports.getMediaUsage = getMediaUsage;
const deleteMedia = async (req, res) => {
    try {
        const { assetKey } = req.params;
        const asset = await MediaAsset_1.MediaAsset.findOne({ assetKey });
        if (!asset) {
            return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Asset not found" } });
        }
        // Check usage
        const usage = await findAssetUsage(assetKey);
        if (usage.live || usage.draft || usage.revisions.length > 0 || usage.campaigns.length > 0) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "CONFLICT",
                    message: "This media asset is still referenced by homepage content and cannot be deleted.",
                },
            });
        }
        // Proceed to delete
        try {
            await (0, cloudinary_1.deleteImageFromCloudinary)(asset.publicId);
        }
        catch (cloudinaryError) {
            console.error("deleteMedia cloudinary error:", cloudinaryError);
            return res.status(500).json({
                success: false,
                error: { code: "PROVIDER_ERROR", message: "Failed to delete from storage provider" },
            });
        }
        await MediaAsset_1.MediaAsset.deleteOne({ _id: asset._id });
        await (0, audit_1.logHomepageMutation)({
            req,
            action: "MEDIA_DELETE",
            details: { assetKey: asset.assetKey },
        });
        (0, homepageMetrics_1.recordMediaMetric)("delete", false);
        res.status(200).json({ success: true });
    }
    catch (error) {
        (0, homepageMetrics_1.recordMediaMetric)("delete", true);
        (0, homepageMetrics_1.recordErrorMetric)("database_error");
        console.error("deleteMedia error:", error);
        res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to delete media" } });
    }
};
exports.deleteMedia = deleteMedia;
