import { Request, Response } from "express";
import { HomepageSection } from "../models/HomepageSection";
import { HomepageRevision } from "../models/HomepageRevision";
import { createSectionSchema, updateSectionSchema, reorderSectionsSchema } from "../validators/homepage";
import { emitToAll } from "../realtime/socket";
import { logHomepageMutation } from "../utils/audit";
import { logger } from "../utils/logger";

// --- HELPERS ---

const triggerUpdateEvent = () => {
  emitToAll("homepage_updated", { version: Date.now().toString() });
};

// --- PUBLIC ---

export const getPublicHomepage = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const sections = await HomepageSection.find({ enabled: true })
      .sort({ order: 1 })
      .select("-__v -createdAt -updatedAt")
      .lean();
    logger.info("Fetched public homepage", { reqId: req.id, duration: Date.now() - start });
    res.status(200).json({ success: true, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

// --- ADMIN ---

export const getAdminHomepage = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const draft = await HomepageRevision.findOne({ status: "draft" }).lean();
    if (!draft) {
      return res.status(404).json({ success: false, error: { message: "No active draft found. Has the seed script been run?" } });
    }

    const sections = draft.sections.sort((a: any, b: any) => a.order - b.order);
    
    logger.info("Fetched admin homepage draft", { reqId: req.id, duration: Date.now() - start, revisionId: draft.revisionId });
    res.status(200).json({ success: true, data: sections, revisionId: draft.revisionId, publishedAt: draft.publishedAt });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const createAdminHomepageSection = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const data = createSectionSchema.parse(req.body);

    const draft = await HomepageRevision.findOne({ status: "draft" });
    if (!draft) {
      return res.status(404).json({ success: false, error: { message: "No active draft found." } });
    }

    const existing = draft.sections.find(s => s.sectionKey === data.sectionKey);
    if (existing) {
      return res.status(409).json({ success: false, error: { code: "SECTION_ALREADY_EXISTS", message: "A section with this key already exists" } });
    }

    const newSection = { ...data, isProtected: false };
    draft.sections.push(newSection as any);
    
    await draft.save();
    
    // The pushed section now has an _id. We can retrieve it.
    const createdSection = draft.sections[draft.sections.length - 1];

    await logHomepageMutation({
      req,
      action: "CREATE",
      sectionId: createdSection._id as string,
      sectionKey: createdSection.sectionKey,
    });

    // DO NOT trigger homepage_updated here, draft changes do not affect live site
    // triggerUpdateEvent();

    logger.info("Created homepage section in draft", { reqId: req.id, duration: Date.now() - start, sectionKey: data.sectionKey });
    res.status(201).json({ success: true, data: createdSection });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    logger.error("Failed to create homepage section in draft", { reqId: req.id, error: error.message });
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const updateAdminHomepageSection = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const data = updateSectionSchema.parse(req.body);

    const draft = await HomepageRevision.findOne({ status: "draft" });
    if (!draft) {
      return res.status(404).json({ success: false, error: { message: "No active draft found." } });
    }

    const section = draft.sections.id(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, error: { code: "SECTION_NOT_FOUND", message: "Homepage section not found" } });
    }

    const changes: Record<string, any> = {};
    if (data.title !== undefined && data.title !== section.title) changes.title = { from: section.title, to: data.title };
    if (data.subtitle !== undefined && data.subtitle !== section.subtitle) changes.subtitle = { from: section.subtitle, to: data.subtitle };
    if (data.enabled !== undefined && data.enabled !== section.enabled) changes.enabled = { from: section.enabled, to: data.enabled };
    if (data.order !== undefined && data.order !== section.order) changes.order = { from: section.order, to: data.order };
    if (data.config !== undefined) {
      changes.config = { changed: true };
    }

    Object.assign(section, data);
    await draft.save();

    await logHomepageMutation({
      req,
      action: "UPDATE",
      sectionId: section._id as string,
      sectionKey: section.sectionKey,
      changes,
    });

    logger.info("Updated homepage section in draft", { reqId: req.id, duration: Date.now() - start, sectionKey: section.sectionKey });
    res.status(200).json({ success: true, data: section });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, error: { message: "Invalid ID format" } });
    }
    logger.error("Failed to update homepage section in draft", { reqId: req.id, error: error.message });
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const deleteAdminHomepageSection = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const draft = await HomepageRevision.findOne({ status: "draft" });
    if (!draft) {
      return res.status(404).json({ success: false, error: { message: "No active draft found." } });
    }

    const section = draft.sections.id(req.params.id);
    if (!section) {
      return res.status(404).json({ success: false, error: { code: "SECTION_NOT_FOUND", message: "Homepage section not found" } });
    }

    if (section.isProtected) {
      logger.warn("Attempted to delete protected homepage section from draft", { reqId: req.id, sectionKey: section.sectionKey });
      return res.status(409).json({ success: false, error: { code: "SECTION_PROTECTED", message: "Protected sections cannot be deleted" } });
    }

    draft.sections.pull(req.params.id);
    await draft.save();

    await logHomepageMutation({
      req,
      action: "DELETE",
      sectionId: section._id as string,
      sectionKey: section.sectionKey,
      metadata: { deletedType: section.type, deletedTitle: section.title },
    });

    logger.info("Deleted homepage section from draft", { reqId: req.id, duration: Date.now() - start, sectionKey: section.sectionKey });
    res.status(200).json({ success: true, data: { message: "Section deleted" } });
  } catch (error: any) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, error: { message: "Invalid ID format" } });
    }
    logger.error("Failed to delete homepage section from draft", { reqId: req.id, error: error.message });
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const reorderAdminHomepageSections = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const data = reorderSectionsSchema.parse(req.body);

    const draft = await HomepageRevision.findOne({ status: "draft" });
    if (!draft) {
      return res.status(404).json({ success: false, error: { message: "No active draft found." } });
    }

    let modified = false;
    for (const sec of data.sections) {
      const section = draft.sections.id(sec.id);
      if (section && section.order !== sec.order) {
        section.order = sec.order;
        modified = true;
      }
    }

    if (modified) {
      await draft.save();
      
      await logHomepageMutation({
        req,
        action: "REORDER",
        metadata: {
          items: data.sections.map(s => ({ id: s.id, to: s.order }))
        }
      });
    }

    logger.info("Reordered homepage sections in draft", { reqId: req.id, duration: Date.now() - start });
    res.status(200).json({ success: true, data: { message: "Sections reordered successfully" } });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    logger.error("Failed to reorder homepage sections in draft", { reqId: req.id, error: error.message });
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const getAdminHomepagePreview = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const draft = await HomepageRevision.findOne({ status: "draft" }).lean();
    if (!draft) {
      return res.status(404).json({ success: false, error: { message: "No active draft found." } });
    }

    // Filter and sort exactly like the public endpoint would
    const sections = draft.sections
      .filter((s: any) => s.enabled)
      .sort((a: any, b: any) => a.order - b.order);

    logger.info("Fetched admin homepage preview", { reqId: req.id, duration: Date.now() - start });
    res.status(200).json({ success: true, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

import mongoose from "mongoose";

export const publishAdminHomepage = async (req: Request, res: Response) => {
  const start = Date.now();
  
  // Use a MongoDB session transaction for atomic publishing
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    const draft = await HomepageRevision.findOne({ status: "draft" }).session(session);
    if (!draft) {
      throw new Error("No active draft found.");
    }

    const { revisionId } = req.body;
    if (revisionId !== draft.revisionId) {
      // Stale publish protection
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, error: { code: "STALE_REVISION", message: "The draft has changed since you opened it. Refresh the draft before publishing." } });
    }

    // Replace live sections atomically via bulkWrite
    const bulkOps: any[] = [];
    
    // We want to delete any live sections that are no longer in the draft
    const draftIds = draft.sections.map(s => s._id.toString());
    bulkOps.push({
      deleteMany: {
        filter: { _id: { $nin: draftIds } }
      }
    });

    // We upsert all draft sections to the live collection to perfectly mirror it, preserving _ids
    for (const sec of draft.sections) {
      bulkOps.push({
        updateOne: {
          filter: { _id: sec._id },
          update: { $set: sec.toObject() },
          upsert: true
        }
      });
    }

    await HomepageSection.bulkWrite(bulkOps, { session });

    // Mark current revision as published
    draft.status = "published";
    draft.publishedAt = new Date();
    // @ts-ignore
    draft.publishedBy = req.user.userId;
    await draft.save({ session });

    // Create next draft
    const nextRevisionId = draft.revisionId + 1;
    await HomepageRevision.create([{
      revisionId: nextRevisionId,
      status: "draft",
      sections: draft.sections.toObject()
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Side-effects outside of transaction
    await logHomepageMutation({
      req,
      action: "PUBLISH",
      metadata: { revisionId: draft.revisionId, nextRevisionId }
    });

    triggerUpdateEvent();

    logger.info("Published homepage successfully", { reqId: req.id, duration: Date.now() - start, revisionId: draft.revisionId });
    res.status(200).json({ success: true, data: { message: "Homepage published successfully", revisionId: nextRevisionId } });
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    logger.error("Failed to publish homepage", { reqId: req.id, error: error.message });
    res.status(error.message === "No active draft found." ? 404 : 500).json({ success: false, error: { message: error.message || "Internal server error" } });
  }
};
