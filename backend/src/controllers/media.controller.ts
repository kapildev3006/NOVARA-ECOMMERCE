import { Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "../utils/cloudinary";
import { MediaAsset } from "../models/MediaAsset";
import { HomepageSection } from "../models/HomepageSection";
import { HomepageRevision } from "../models/HomepageRevision";
import { HomepageCampaign } from "../models/HomepageCampaign";
import { logHomepageMutation } from "../utils/audit";
import { recordMediaMetric, recordErrorMetric } from "../utils/homepageMetrics";

// Configure Multer
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
}).single("file");

// Helpers for usage detection
const findAssetUsage = async (assetKey: string) => {
  // We assume the assetKey is stored under config.image.assetKey in section configurations
  const query = { "sections.config.image.assetKey": assetKey };

  // 1. Live Sections
  const liveSections = await HomepageSection.find({ "config.image.assetKey": assetKey }).lean();
  
  // 2. Revisions (draft, scheduled, published, executing, cancelled)
  const revisions = await HomepageRevision.find(query).select("revisionId status").lean();
  
  // 3. Campaigns
  const campaigns = await HomepageCampaign.find({
    $or: [
      { "sections.config.image.assetKey": assetKey },
      { "fallbackRevisionId": { $in: revisions.map((r) => r.revisionId) } as any } // Or just check if any revision has it
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

export const uploadMedia = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "No file uploaded" } });
  }

  try {
    const buffer = req.file.buffer;
    const result = await uploadImageToCloudinary(buffer, "novara/homepage");

    const newAsset = await MediaAsset.create({
      assetKey: `asset_${uuidv4().replace(/-/g, "")}`,
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

    await logHomepageMutation({
      req,
      action: "MEDIA_UPLOAD",
      details: { assetKey: newAsset.assetKey, publicId: newAsset.publicId },
    } as any);

    recordMediaMetric("upload", false, result.bytes);
    res.status(201).json({ success: true, asset: newAsset });
  } catch (error) {
    recordMediaMetric("upload", true);
    recordErrorMetric("cloudinary_error");
    console.error("uploadMedia error:", error);
    res.status(500).json({ success: false, error: { code: "UPLOAD_FAILED", message: "Failed to upload image" } });
  }
};

export const listMedia = async (req: Request, res: Response) => {
  try {
    const pageParam = typeof req.query.page === "string" ? req.query.page : "1";
    const limitParam = typeof req.query.limit === "string" ? req.query.limit : "20";
    const page = parseInt(pageParam, 10);
    const limit = parseInt(limitParam, 10);
    const skip = (page - 1) * limit;

    const [assets, total] = await Promise.all([
      MediaAsset.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MediaAsset.countDocuments(),
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
  } catch (error) {
    console.error("listMedia error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to list media" } });
  }
};

export const getMediaDetail = async (req: Request, res: Response) => {
  try {
    const { assetKey } = req.params;
    const asset = await MediaAsset.findOne({ assetKey }).lean();
    if (!asset) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Asset not found" } });
    }
    res.status(200).json({ success: true, asset });
  } catch (error) {
    console.error("getMediaDetail error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to get media details" } });
  }
};

export const updateMediaMetadata = async (req: Request, res: Response) => {
  try {
    const { assetKey } = req.params;
    const { altText, caption, tags, folder } = req.body;

    const asset = await MediaAsset.findOne({ assetKey });
    if (!asset) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Asset not found" } });
    }

    if (altText !== undefined) asset.altText = altText;
    if (caption !== undefined) asset.caption = caption;
    if (tags !== undefined) asset.tags = tags;
    if (folder !== undefined) asset.folder = folder;

    await asset.save();

    await logHomepageMutation({
      req,
      action: "MEDIA_UPDATE",
      details: { assetKey: asset.assetKey },
    } as any);

    recordMediaMetric("update", false);
    res.status(200).json({ success: true, asset });
  } catch (error) {
    recordMediaMetric("update", true);
    recordErrorMetric("database_error");
    console.error("updateMediaMetadata error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update media" } });
  }
};

export const getMediaUsage = async (req: Request, res: Response) => {
  try {
    const { assetKey } = req.params;
    const usage = await findAssetUsage(assetKey as string);
    res.status(200).json({ success: true, usage });
  } catch (error) {
    console.error("getMediaUsage error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to check media usage" } });
  }
};

export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const { assetKey } = req.params;
    const asset = await MediaAsset.findOne({ assetKey });
    if (!asset) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Asset not found" } });
    }

    // Check usage
    const usage = await findAssetUsage(assetKey as string);
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
      await deleteImageFromCloudinary(asset.publicId);
    } catch (cloudinaryError) {
      console.error("deleteMedia cloudinary error:", cloudinaryError);
      return res.status(500).json({
        success: false,
        error: { code: "PROVIDER_ERROR", message: "Failed to delete from storage provider" },
      });
    }

    await MediaAsset.deleteOne({ _id: asset._id });

    await logHomepageMutation({
      req,
      action: "MEDIA_DELETE",
      details: { assetKey: asset.assetKey },
    } as any);

    recordMediaMetric("delete", false);
    res.status(200).json({ success: true });
  } catch (error) {
    recordMediaMetric("delete", true);
    recordErrorMetric("database_error");
    console.error("deleteMedia error:", error);
    res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to delete media" } });
  }
};
