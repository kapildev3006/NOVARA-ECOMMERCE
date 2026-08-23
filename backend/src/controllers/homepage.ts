import mongoose from "mongoose";
import { Request, Response } from "express";
import { HomepageSection } from "../models/HomepageSection";
import { HomepageRevision } from "../models/HomepageRevision";
import { HomepageCampaign } from "../models/HomepageCampaign";
import { getNextSequence } from "../models/Counter";
import { createSectionSchema, updateSectionSchema, reorderSectionsSchema } from "../validators/homepage";
import { schedulePublishSchema } from "../validators/homepageSchedule";
import { emitToAll } from "../realtime/socket";
import { logHomepageMutation } from "../utils/audit";
import { logger } from "../utils/logger";
import { recordHomepageMetric, recordPublishMetric, recordErrorMetric, recordSocketMetric, recordFallbackMetric } from "../utils/homepageMetrics";
import { validateHomepageRevision } from "../services/homepageValidation";

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
    const duration = Date.now() - start;
    logger.info("Fetched public homepage", { reqId: req.id, duration });
    recordHomepageMetric(duration, false, duration > 300);
    
    if (req.query.source === "socket") {
      recordSocketMetric("refetch");
    }

    res.status(200).json({ success: true, data: sections });
  } catch (error) {
    recordHomepageMetric(Date.now() - start, true, false);
    recordErrorMetric("database_error");
    recordFallbackMetric();
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
    
    const scheduled = await HomepageRevision.findOne({ status: "scheduled" }).lean();

    logger.info("Fetched admin homepage draft", { reqId: req.id, duration: Date.now() - start, revisionId: draft.revisionId });
    res.status(200).json({ 
      success: true, 
      data: sections, 
      revisionId: draft.revisionId, 
      publishedAt: draft.publishedAt,
      scheduledRevision: scheduled ? {
        revisionId: scheduled.revisionId,
        scheduledPublishAt: scheduled.scheduledPublishAt,
        scheduledBy: scheduled.scheduledBy
      } : null
    });
    const duration = Date.now() - start;
    recordHomepageMetric(duration, false, duration > 500);
  } catch (error) {
    recordHomepageMetric(Date.now() - start, true, false);
    recordErrorMetric("database_error");
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

    const existing = draft.sections.find((s: any) => s.sectionKey === data.sectionKey);
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

    const duration = Date.now() - start;
    logger.info("Created homepage section in draft", { reqId: req.id, duration, sectionKey: data.sectionKey });
    recordHomepageMetric(duration, false, duration > 750);
    res.status(201).json({ success: true, data: createdSection });
  } catch (error: any) {
    recordHomepageMetric(Date.now() - start, true, false);
    if (error.name === "ZodError") {
      recordErrorMetric("validation_error");
      return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    recordErrorMetric("unknown");
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

    const duration = Date.now() - start;
    logger.info("Updated homepage section in draft", { reqId: req.id, duration, sectionKey: section.sectionKey });
    recordHomepageMetric(duration, false, duration > 750);
    res.status(200).json({ success: true, data: section });
  } catch (error: any) {
    recordHomepageMetric(Date.now() - start, true, false);
    if (error.name === "ZodError") {
      recordErrorMetric("validation_error");
      return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    if (error.name === "CastError") {
      recordErrorMetric("validation_error");
      return res.status(400).json({ success: false, error: { message: "Invalid ID format" } });
    }
    recordErrorMetric("unknown");
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

    const duration = Date.now() - start;
    logger.info("Deleted homepage section from draft", { reqId: req.id, duration, sectionKey: section.sectionKey });
    recordHomepageMetric(duration, false, duration > 750);
    res.status(200).json({ success: true, data: { message: "Section deleted" } });
  } catch (error: any) {
    recordHomepageMetric(Date.now() - start, true, false);
    if (error.name === "CastError") {
      recordErrorMetric("validation_error");
      return res.status(400).json({ success: false, error: { message: "Invalid ID format" } });
    }
    recordErrorMetric("unknown");
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

    const duration = Date.now() - start;
    logger.info("Reordered homepage sections in draft", { reqId: req.id, duration });
    recordHomepageMetric(duration, false, duration > 750);
    res.status(200).json({ success: true, data: { message: "Sections reordered successfully" } });
  } catch (error: any) {
    recordHomepageMetric(Date.now() - start, true, false);
    if (error.name === "ZodError") {
      recordErrorMetric("validation_error");
      return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    recordErrorMetric("unknown");
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
import { applyRevisionToLiveHomepage } from "../services/homepageService";

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

    const scheduled = await HomepageRevision.findOne({ status: "scheduled" }).session(session);
    if (scheduled) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, error: { code: "SCHEDULE_EXISTS", message: "An active schedule already exists. Cancel the schedule before publishing manually." } });
    }

    const scheduledCampaign = await HomepageCampaign.findOne({ status: { $in: ["scheduled", "active"] } }).session(session);
    if (scheduledCampaign) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, error: { code: "CAMPAIGN_EXISTS", message: "A homepage campaign is currently scheduled or active. Cancel or complete it before publishing manually." } });
    }

    // QA Gate
    const validation = await validateHomepageRevision(draft);
    if (!validation.valid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(422).json({ success: false, error: { code: "CONTENT_VALIDATION_FAILED", message: "Homepage validation failed.", details: validation.errors, warnings: validation.warnings } });
    }

    // Replace live sections atomically
    await applyRevisionToLiveHomepage(draft.revisionId, session);

    // Mark current revision as published
    draft.status = "published";
    draft.publishedAt = new Date();
    // @ts-ignore
    draft.publishedBy = req.user.userId;
    await draft.save({ session });

    // Create next draft
    const nextRevisionId = await getNextSequence("homepageRevision", session);
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

    const duration = Date.now() - start;
    logger.info("Published homepage successfully", { reqId: req.id, duration, revisionId: draft.revisionId });
    if (duration > 1500) {
      logger.warn("homepage_slow_operation", { operation: "publish", durationMs: duration, thresholdMs: 1500 });
    }
    recordPublishMetric(duration, false);
    res.status(200).json({ success: true, data: { message: "Homepage published successfully", revisionId: nextRevisionId } });
  } catch (error: any) {
    recordPublishMetric(Date.now() - start, true);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    logger.error("Failed to publish homepage", { reqId: req.id, error: error.message });
    
    if (error.message === "No active draft found.") {
      recordErrorMetric("not_found");
      res.status(404).json({ success: false, error: { message: error.message } });
    } else {
      recordErrorMetric("database_error");
      res.status(500).json({ success: false, error: { message: error.message || "Internal server error" } });
    }
  }
};

export const getAdminHomepageRevisions = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const total = await HomepageRevision.countDocuments({ status: "published" });
    const revisions = await HomepageRevision.find({ status: "published" })
      .select("-sections -__v")
      .sort({ revisionId: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    logger.info("Fetched homepage revisions", { reqId: req.id, duration: Date.now() - start });
    res.status(200).json({
      success: true,
      data: revisions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    logger.error("Failed to fetch homepage revisions", { reqId: req.id, error: error.message });
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const getAdminHomepageRevisionDetail = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const revisionId = parseInt(req.params.revisionId as string, 10);
    if (isNaN(revisionId)) {
      return res.status(400).json({ success: false, error: { message: "Invalid revision ID" } });
    }

    const revision = await HomepageRevision.findOne({ revisionId, status: "published" })
      .select("-__v")
      .lean();

    if (!revision) {
      return res.status(404).json({ success: false, error: { message: "Historical revision not found" } });
    }

    revision.sections.sort((a: any, b: any) => a.order - b.order);

    logger.info("Fetched homepage revision detail", { reqId: req.id, duration: Date.now() - start, revisionId });
    res.status(200).json({ success: true, data: revision });
  } catch (error: any) {
    logger.error("Failed to fetch homepage revision detail", { reqId: req.id, error: error.message });
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const rollbackHomepageRevision = async (req: Request, res: Response) => {
  const start = Date.now();
  
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    const revisionId = parseInt(req.params.revisionId as string, 10);
    if (isNaN(revisionId)) {
      throw new Error("Invalid revision ID");
    }

    const sourceRevision = await HomepageRevision.findOne({ revisionId, status: "published" }).session(session);
    if (!sourceRevision) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, error: { message: "Historical revision not found" } });
    }

    const { currentDraftRevisionId } = req.body;

    const currentDraft = await HomepageRevision.findOne({ status: "draft" }).session(session);
    if (!currentDraft) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, error: { message: "No active draft found." } });
    }

    if (currentDraftRevisionId !== undefined && currentDraft.revisionId !== currentDraftRevisionId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, error: { code: "STALE_REVISION", message: "The current draft changed after you loaded the revision history. Refresh before creating a rollback draft." } });
    }

    // Delete current draft
    const deleteResult = await HomepageRevision.deleteOne({ _id: currentDraft._id }).session(session);
    if (deleteResult.deletedCount === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, error: { message: "Concurrent modification detected. Draft was already modified." } });
    }

    // Atomically find the highest revisionId to safely allocate the next one.
    const nextRevisionId = await getNextSequence("homepageRevision", session);

    // QA Gate for rollback target
    const validation = await validateHomepageRevision(sourceRevision);
    if (!validation.valid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(422).json({ success: false, error: { code: "CONTENT_VALIDATION_FAILED", message: "Historical revision is invalid and cannot be rolled back to.", details: validation.errors, warnings: validation.warnings } });
    }

    // Create new draft from source
    const newDraftSections = sourceRevision.sections.map((s: any) => s.toObject());

    await HomepageRevision.create([{
      revisionId: nextRevisionId,
      status: "draft",
      sections: newDraftSections,
      rollbackFromRevisionId: sourceRevision.revisionId,
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Side-effects outside of transaction
    await logHomepageMutation({
      req,
      action: "ROLLBACK",
      metadata: { sourceRevisionId: sourceRevision.revisionId, newDraftRevisionId: nextRevisionId }
    });

    logger.info("Created rollback draft", { reqId: req.id, duration: Date.now() - start, newDraftRevisionId: nextRevisionId });
    res.status(201).json({ success: true, data: { message: "Rollback draft created successfully", revisionId: nextRevisionId } });
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    logger.error("Failed to rollback", { reqId: req.id, error: error.message });
    
    // Handle Write Conflict error for transactions modifying the same document
    if (error.message?.includes("Write conflict") || error.hasErrorLabel?.("TransientTransactionError")) {
      return res.status(409).json({ success: false, error: { message: "Concurrent modification detected. Please try again." } });
    }
    
    // Handle duplicate key error for revisionId concurrency
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: { message: "Concurrent revision creation detected. Please try again." } });
    }
    
    res.status(error.message === "Invalid revision ID" ? 400 : 500).json({ success: false, error: { message: error.message || "Internal server error" } });
  }
};

export const getAdminHomepageRevisionPreview = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const revisionId = parseInt(req.params.revisionId as string, 10);
    if (isNaN(revisionId)) {
      return res.status(400).json({ success: false, error: { message: "Invalid revision ID" } });
    }

    const revision = await HomepageRevision.findOne({ revisionId, status: "published" }).lean();
    if (!revision) {
      return res.status(404).json({ success: false, error: { message: "Historical revision not found" } });
    }

    // Filter and sort exactly like the public endpoint would
    const sections = revision.sections
      .filter((s: any) => s.enabled)
      .sort((a: any, b: any) => a.order - b.order);

    logger.info("Fetched historical revision preview", { reqId: req.id, duration: Date.now() - start, revisionId });
    res.status(200).json({ success: true, data: sections });
  } catch (error: any) {
    logger.error("Failed to fetch historical revision preview", { reqId: req.id, error: error.message });
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const scheduleAdminHomepage = async (req: Request, res: Response) => {
  const start = Date.now();
  
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const data = schedulePublishSchema.parse(req.body);

    const draft = await HomepageRevision.findOne({ status: "draft" }).session(session);
    if (!draft) {
      throw new Error("No active draft found.");
    }

    if (data.revisionId !== draft.revisionId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, error: { code: "STALE_REVISION", message: "The draft has changed. Refresh before scheduling." } });
    }

    const existingSchedule = await HomepageRevision.findOne({ status: "scheduled" }).session(session);
    if (existingSchedule) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, error: { code: "SCHEDULE_EXISTS", message: "An active schedule already exists. Cancel it before scheduling a new one." } });
    }

    const scheduledCampaign = await HomepageCampaign.findOne({ status: { $in: ["scheduled", "active"] } }).session(session);
    if (scheduledCampaign) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, error: { code: "CAMPAIGN_EXISTS", message: "A homepage campaign is currently scheduled or active. Cancel or complete it before scheduling." } });
    }

    // QA Gate
    const validation = await validateHomepageRevision(draft);
    if (!validation.valid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(422).json({ success: false, error: { code: "CONTENT_VALIDATION_FAILED", message: "Homepage validation failed.", details: validation.errors, warnings: validation.warnings } });
    }

    // Mark current revision as scheduled
    draft.status = "scheduled";
    draft.scheduledPublishAt = new Date(data.publishAt);
    // @ts-ignore
    draft.scheduledBy = req.user.userId;
    draft.scheduledAt = new Date();
    await draft.save({ session });

    // Create next draft immediately for further editing
    const nextRevisionId = await getNextSequence("homepageRevision", session);
    await HomepageRevision.create([{
      revisionId: nextRevisionId,
      status: "draft",
      sections: draft.sections.toObject()
    }], { session });

    await session.commitTransaction();
    session.endSession();

    await logHomepageMutation({
      req,
      action: "SCHEDULE",
      metadata: { revisionId: draft.revisionId, nextRevisionId, scheduledPublishAt: draft.scheduledPublishAt }
    });

    logger.info("Scheduled homepage publish", { reqId: req.id, duration: Date.now() - start, revisionId: draft.revisionId });
    res.status(200).json({ success: true, data: { message: "Scheduled successfully", revisionId: nextRevisionId } });
  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    if (error.name === "ZodError") {
      return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    logger.error("Failed to schedule homepage", { reqId: req.id, error: error.message });
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const cancelAdminHomepageSchedule = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const scheduled = await HomepageRevision.findOne({ status: "scheduled" });
    if (!scheduled) {
      return res.status(404).json({ success: false, error: { message: "No active schedule found." } });
    }

    scheduled.status = "cancelled";
    await scheduled.save();

    await logHomepageMutation({
      req,
      action: "SCHEDULE_CANCEL",
      metadata: { revisionId: scheduled.revisionId }
    });

    logger.info("Cancelled homepage schedule", { reqId: req.id, duration: Date.now() - start, revisionId: scheduled.revisionId });
    res.status(200).json({ success: true, data: { message: "Schedule cancelled successfully" } });
  } catch (error: any) {
    logger.error("Failed to cancel homepage schedule", { reqId: req.id, error: error.message });
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const validateAdminHomepage = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const revisionId = parseInt(req.body.revisionId as string, 10);
    if (isNaN(revisionId)) {
      return res.status(400).json({ success: false, error: { message: "Invalid revision ID" } });
    }

    const revision = await HomepageRevision.findOne({ revisionId }).lean();
    if (!revision) {
      return res.status(404).json({ success: false, error: { message: "Revision not found" } });
    }

    const result = await validateHomepageRevision(revision);
    
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    logger.error("Failed to validate homepage revision", { reqId: req.id, error: error.message });
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};
