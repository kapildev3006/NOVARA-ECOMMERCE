"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAdminHomepage = exports.cancelAdminHomepageSchedule = exports.scheduleAdminHomepage = exports.getAdminHomepageRevisionPreview = exports.rollbackHomepageRevision = exports.getAdminHomepageRevisionDetail = exports.getAdminHomepageRevisions = exports.publishAdminHomepage = exports.getAdminHomepagePreview = exports.reorderAdminHomepageSections = exports.deleteAdminHomepageSection = exports.updateAdminHomepageSection = exports.createAdminHomepageSection = exports.getAdminHomepage = exports.getPublicHomepage = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const HomepageSection_1 = require("../models/HomepageSection");
const HomepageRevision_1 = require("../models/HomepageRevision");
const HomepageCampaign_1 = require("../models/HomepageCampaign");
const Counter_1 = require("../models/Counter");
const homepage_1 = require("../validators/homepage");
const homepageSchedule_1 = require("../validators/homepageSchedule");
const socket_1 = require("../realtime/socket");
const audit_1 = require("../utils/audit");
const logger_1 = require("../utils/logger");
const homepageMetrics_1 = require("../utils/homepageMetrics");
const homepageValidation_1 = require("../services/homepageValidation");
// --- HELPERS ---
const triggerUpdateEvent = () => {
    (0, socket_1.emitToAll)("homepage_updated", { version: Date.now().toString() });
};
// --- PUBLIC ---
const getPublicHomepage = async (req, res) => {
    const start = Date.now();
    try {
        const sections = await HomepageSection_1.HomepageSection.find({ enabled: true })
            .sort({ order: 1 })
            .select("-__v -createdAt -updatedAt")
            .lean();
        const duration = Date.now() - start;
        logger_1.logger.info("Fetched public homepage", { reqId: req.id, duration });
        (0, homepageMetrics_1.recordHomepageMetric)(duration, false, duration > 300);
        if (req.query.source === "socket") {
            (0, homepageMetrics_1.recordSocketMetric)("refetch");
        }
        res.status(200).json({ success: true, data: sections });
    }
    catch (error) {
        (0, homepageMetrics_1.recordHomepageMetric)(Date.now() - start, true, false);
        (0, homepageMetrics_1.recordErrorMetric)("database_error");
        (0, homepageMetrics_1.recordFallbackMetric)();
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getPublicHomepage = getPublicHomepage;
// --- ADMIN ---
const getAdminHomepage = async (req, res) => {
    const start = Date.now();
    try {
        const draft = await HomepageRevision_1.HomepageRevision.findOne({ status: "draft" }).lean();
        if (!draft) {
            return res.status(404).json({ success: false, error: { message: "No active draft found. Has the seed script been run?" } });
        }
        const sections = draft.sections.sort((a, b) => a.order - b.order);
        const scheduled = await HomepageRevision_1.HomepageRevision.findOne({ status: "scheduled" }).lean();
        logger_1.logger.info("Fetched admin homepage draft", { reqId: req.id, duration: Date.now() - start, revisionId: draft.revisionId });
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
        (0, homepageMetrics_1.recordHomepageMetric)(duration, false, duration > 500);
    }
    catch (error) {
        (0, homepageMetrics_1.recordHomepageMetric)(Date.now() - start, true, false);
        (0, homepageMetrics_1.recordErrorMetric)("database_error");
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getAdminHomepage = getAdminHomepage;
const createAdminHomepageSection = async (req, res) => {
    const start = Date.now();
    try {
        const data = homepage_1.createSectionSchema.parse(req.body);
        const draft = await HomepageRevision_1.HomepageRevision.findOne({ status: "draft" });
        if (!draft) {
            return res.status(404).json({ success: false, error: { message: "No active draft found." } });
        }
        const existing = draft.sections.find((s) => s.sectionKey === data.sectionKey);
        if (existing) {
            return res.status(409).json({ success: false, error: { code: "SECTION_ALREADY_EXISTS", message: "A section with this key already exists" } });
        }
        const newSection = { ...data, isProtected: false };
        draft.sections.push(newSection);
        await draft.save();
        // The pushed section now has an _id. We can retrieve it.
        const createdSection = draft.sections[draft.sections.length - 1];
        await (0, audit_1.logHomepageMutation)({
            req,
            action: "CREATE",
            sectionId: createdSection._id,
            sectionKey: createdSection.sectionKey,
        });
        // DO NOT trigger homepage_updated here, draft changes do not affect live site
        // triggerUpdateEvent();
        const duration = Date.now() - start;
        logger_1.logger.info("Created homepage section in draft", { reqId: req.id, duration, sectionKey: data.sectionKey });
        (0, homepageMetrics_1.recordHomepageMetric)(duration, false, duration > 750);
        res.status(201).json({ success: true, data: createdSection });
    }
    catch (error) {
        (0, homepageMetrics_1.recordHomepageMetric)(Date.now() - start, true, false);
        if (error.name === "ZodError") {
            (0, homepageMetrics_1.recordErrorMetric)("validation_error");
            return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
        }
        (0, homepageMetrics_1.recordErrorMetric)("unknown");
        logger_1.logger.error("Failed to create homepage section in draft", { reqId: req.id, error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.createAdminHomepageSection = createAdminHomepageSection;
const updateAdminHomepageSection = async (req, res) => {
    const start = Date.now();
    try {
        const data = homepage_1.updateSectionSchema.parse(req.body);
        const draft = await HomepageRevision_1.HomepageRevision.findOne({ status: "draft" });
        if (!draft) {
            return res.status(404).json({ success: false, error: { message: "No active draft found." } });
        }
        const section = draft.sections.id(req.params.id);
        if (!section) {
            return res.status(404).json({ success: false, error: { code: "SECTION_NOT_FOUND", message: "Homepage section not found" } });
        }
        const changes = {};
        if (data.title !== undefined && data.title !== section.title)
            changes.title = { from: section.title, to: data.title };
        if (data.subtitle !== undefined && data.subtitle !== section.subtitle)
            changes.subtitle = { from: section.subtitle, to: data.subtitle };
        if (data.enabled !== undefined && data.enabled !== section.enabled)
            changes.enabled = { from: section.enabled, to: data.enabled };
        if (data.order !== undefined && data.order !== section.order)
            changes.order = { from: section.order, to: data.order };
        if (data.config !== undefined) {
            changes.config = { changed: true };
        }
        Object.assign(section, data);
        await draft.save();
        await (0, audit_1.logHomepageMutation)({
            req,
            action: "UPDATE",
            sectionId: section._id,
            sectionKey: section.sectionKey,
            changes,
        });
        const duration = Date.now() - start;
        logger_1.logger.info("Updated homepage section in draft", { reqId: req.id, duration, sectionKey: section.sectionKey });
        (0, homepageMetrics_1.recordHomepageMetric)(duration, false, duration > 750);
        res.status(200).json({ success: true, data: section });
    }
    catch (error) {
        (0, homepageMetrics_1.recordHomepageMetric)(Date.now() - start, true, false);
        if (error.name === "ZodError") {
            (0, homepageMetrics_1.recordErrorMetric)("validation_error");
            return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
        }
        if (error.name === "CastError") {
            (0, homepageMetrics_1.recordErrorMetric)("validation_error");
            return res.status(400).json({ success: false, error: { message: "Invalid ID format" } });
        }
        (0, homepageMetrics_1.recordErrorMetric)("unknown");
        logger_1.logger.error("Failed to update homepage section in draft", { reqId: req.id, error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.updateAdminHomepageSection = updateAdminHomepageSection;
const deleteAdminHomepageSection = async (req, res) => {
    const start = Date.now();
    try {
        const draft = await HomepageRevision_1.HomepageRevision.findOne({ status: "draft" });
        if (!draft) {
            return res.status(404).json({ success: false, error: { message: "No active draft found." } });
        }
        const section = draft.sections.id(req.params.id);
        if (!section) {
            return res.status(404).json({ success: false, error: { code: "SECTION_NOT_FOUND", message: "Homepage section not found" } });
        }
        if (section.isProtected) {
            logger_1.logger.warn("Attempted to delete protected homepage section from draft", { reqId: req.id, sectionKey: section.sectionKey });
            return res.status(409).json({ success: false, error: { code: "SECTION_PROTECTED", message: "Protected sections cannot be deleted" } });
        }
        draft.sections.pull(req.params.id);
        await draft.save();
        await (0, audit_1.logHomepageMutation)({
            req,
            action: "DELETE",
            sectionId: section._id,
            sectionKey: section.sectionKey,
            metadata: { deletedType: section.type, deletedTitle: section.title },
        });
        const duration = Date.now() - start;
        logger_1.logger.info("Deleted homepage section from draft", { reqId: req.id, duration, sectionKey: section.sectionKey });
        (0, homepageMetrics_1.recordHomepageMetric)(duration, false, duration > 750);
        res.status(200).json({ success: true, data: { message: "Section deleted" } });
    }
    catch (error) {
        (0, homepageMetrics_1.recordHomepageMetric)(Date.now() - start, true, false);
        if (error.name === "CastError") {
            (0, homepageMetrics_1.recordErrorMetric)("validation_error");
            return res.status(400).json({ success: false, error: { message: "Invalid ID format" } });
        }
        (0, homepageMetrics_1.recordErrorMetric)("unknown");
        logger_1.logger.error("Failed to delete homepage section from draft", { reqId: req.id, error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.deleteAdminHomepageSection = deleteAdminHomepageSection;
const reorderAdminHomepageSections = async (req, res) => {
    const start = Date.now();
    try {
        const data = homepage_1.reorderSectionsSchema.parse(req.body);
        const draft = await HomepageRevision_1.HomepageRevision.findOne({ status: "draft" });
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
            await (0, audit_1.logHomepageMutation)({
                req,
                action: "REORDER",
                metadata: {
                    items: data.sections.map(s => ({ id: s.id, to: s.order }))
                }
            });
        }
        const duration = Date.now() - start;
        logger_1.logger.info("Reordered homepage sections in draft", { reqId: req.id, duration });
        (0, homepageMetrics_1.recordHomepageMetric)(duration, false, duration > 750);
        res.status(200).json({ success: true, data: { message: "Sections reordered successfully" } });
    }
    catch (error) {
        (0, homepageMetrics_1.recordHomepageMetric)(Date.now() - start, true, false);
        if (error.name === "ZodError") {
            (0, homepageMetrics_1.recordErrorMetric)("validation_error");
            return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
        }
        (0, homepageMetrics_1.recordErrorMetric)("unknown");
        logger_1.logger.error("Failed to reorder homepage sections in draft", { reqId: req.id, error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.reorderAdminHomepageSections = reorderAdminHomepageSections;
const getAdminHomepagePreview = async (req, res) => {
    const start = Date.now();
    try {
        const draft = await HomepageRevision_1.HomepageRevision.findOne({ status: "draft" }).lean();
        if (!draft) {
            return res.status(404).json({ success: false, error: { message: "No active draft found." } });
        }
        // Filter and sort exactly like the public endpoint would
        const sections = draft.sections
            .filter((s) => s.enabled)
            .sort((a, b) => a.order - b.order);
        logger_1.logger.info("Fetched admin homepage preview", { reqId: req.id, duration: Date.now() - start });
        res.status(200).json({ success: true, data: sections });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getAdminHomepagePreview = getAdminHomepagePreview;
const homepageService_1 = require("../services/homepageService");
const publishAdminHomepage = async (req, res) => {
    const start = Date.now();
    // Use a MongoDB session transaction for atomic publishing
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const draft = await HomepageRevision_1.HomepageRevision.findOne({ status: "draft" }).session(session);
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
        const scheduled = await HomepageRevision_1.HomepageRevision.findOne({ status: "scheduled" }).session(session);
        if (scheduled) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ success: false, error: { code: "SCHEDULE_EXISTS", message: "An active schedule already exists. Cancel the schedule before publishing manually." } });
        }
        const scheduledCampaign = await HomepageCampaign_1.HomepageCampaign.findOne({ status: { $in: ["scheduled", "active"] } }).session(session);
        if (scheduledCampaign) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ success: false, error: { code: "CAMPAIGN_EXISTS", message: "A homepage campaign is currently scheduled or active. Cancel or complete it before publishing manually." } });
        }
        // QA Gate
        const validation = await (0, homepageValidation_1.validateHomepageRevision)(draft);
        if (!validation.valid) {
            await session.abortTransaction();
            session.endSession();
            return res.status(422).json({ success: false, error: { code: "CONTENT_VALIDATION_FAILED", message: "Homepage validation failed.", details: validation.errors, warnings: validation.warnings } });
        }
        // Replace live sections atomically
        await (0, homepageService_1.applyRevisionToLiveHomepage)(draft.revisionId, session);
        // Mark current revision as published
        draft.status = "published";
        draft.publishedAt = new Date();
        // @ts-ignore
        draft.publishedBy = req.user.userId;
        await draft.save({ session });
        // Create next draft
        const nextRevisionId = await (0, Counter_1.getNextSequence)("homepageRevision", session);
        await HomepageRevision_1.HomepageRevision.create([{
                revisionId: nextRevisionId,
                status: "draft",
                sections: draft.sections.toObject()
            }], { session });
        await session.commitTransaction();
        session.endSession();
        // Side-effects outside of transaction
        await (0, audit_1.logHomepageMutation)({
            req,
            action: "PUBLISH",
            metadata: { revisionId: draft.revisionId, nextRevisionId }
        });
        triggerUpdateEvent();
        const duration = Date.now() - start;
        logger_1.logger.info("Published homepage successfully", { reqId: req.id, duration, revisionId: draft.revisionId });
        if (duration > 1500) {
            logger_1.logger.warn("homepage_slow_operation", { operation: "publish", durationMs: duration, thresholdMs: 1500 });
        }
        (0, homepageMetrics_1.recordPublishMetric)(duration, false);
        res.status(200).json({ success: true, data: { message: "Homepage published successfully", revisionId: nextRevisionId } });
    }
    catch (error) {
        (0, homepageMetrics_1.recordPublishMetric)(Date.now() - start, true);
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        logger_1.logger.error("Failed to publish homepage", { reqId: req.id, error: error.message });
        if (error.message === "No active draft found.") {
            (0, homepageMetrics_1.recordErrorMetric)("not_found");
            res.status(404).json({ success: false, error: { message: error.message } });
        }
        else {
            (0, homepageMetrics_1.recordErrorMetric)("database_error");
            res.status(500).json({ success: false, error: { message: error.message || "Internal server error" } });
        }
    }
};
exports.publishAdminHomepage = publishAdminHomepage;
const getAdminHomepageRevisions = async (req, res) => {
    const start = Date.now();
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const total = await HomepageRevision_1.HomepageRevision.countDocuments({ status: "published" });
        const revisions = await HomepageRevision_1.HomepageRevision.find({ status: "published" })
            .select("-sections -__v")
            .sort({ revisionId: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        logger_1.logger.info("Fetched homepage revisions", { reqId: req.id, duration: Date.now() - start });
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
    }
    catch (error) {
        logger_1.logger.error("Failed to fetch homepage revisions", { reqId: req.id, error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getAdminHomepageRevisions = getAdminHomepageRevisions;
const getAdminHomepageRevisionDetail = async (req, res) => {
    const start = Date.now();
    try {
        const revisionId = parseInt(req.params.revisionId, 10);
        if (isNaN(revisionId)) {
            return res.status(400).json({ success: false, error: { message: "Invalid revision ID" } });
        }
        const revision = await HomepageRevision_1.HomepageRevision.findOne({ revisionId, status: "published" })
            .select("-__v")
            .lean();
        if (!revision) {
            return res.status(404).json({ success: false, error: { message: "Historical revision not found" } });
        }
        revision.sections.sort((a, b) => a.order - b.order);
        logger_1.logger.info("Fetched homepage revision detail", { reqId: req.id, duration: Date.now() - start, revisionId });
        res.status(200).json({ success: true, data: revision });
    }
    catch (error) {
        logger_1.logger.error("Failed to fetch homepage revision detail", { reqId: req.id, error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getAdminHomepageRevisionDetail = getAdminHomepageRevisionDetail;
const rollbackHomepageRevision = async (req, res) => {
    const start = Date.now();
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const revisionId = parseInt(req.params.revisionId, 10);
        if (isNaN(revisionId)) {
            throw new Error("Invalid revision ID");
        }
        const sourceRevision = await HomepageRevision_1.HomepageRevision.findOne({ revisionId, status: "published" }).session(session);
        if (!sourceRevision) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, error: { message: "Historical revision not found" } });
        }
        const { currentDraftRevisionId } = req.body;
        const currentDraft = await HomepageRevision_1.HomepageRevision.findOne({ status: "draft" }).session(session);
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
        const deleteResult = await HomepageRevision_1.HomepageRevision.deleteOne({ _id: currentDraft._id }).session(session);
        if (deleteResult.deletedCount === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ success: false, error: { message: "Concurrent modification detected. Draft was already modified." } });
        }
        // Atomically find the highest revisionId to safely allocate the next one.
        const nextRevisionId = await (0, Counter_1.getNextSequence)("homepageRevision", session);
        // QA Gate for rollback target
        const validation = await (0, homepageValidation_1.validateHomepageRevision)(sourceRevision);
        if (!validation.valid) {
            await session.abortTransaction();
            session.endSession();
            return res.status(422).json({ success: false, error: { code: "CONTENT_VALIDATION_FAILED", message: "Historical revision is invalid and cannot be rolled back to.", details: validation.errors, warnings: validation.warnings } });
        }
        // Create new draft from source
        const newDraftSections = sourceRevision.sections.map((s) => s.toObject());
        await HomepageRevision_1.HomepageRevision.create([{
                revisionId: nextRevisionId,
                status: "draft",
                sections: newDraftSections,
                rollbackFromRevisionId: sourceRevision.revisionId,
            }], { session });
        await session.commitTransaction();
        session.endSession();
        // Side-effects outside of transaction
        await (0, audit_1.logHomepageMutation)({
            req,
            action: "ROLLBACK",
            metadata: { sourceRevisionId: sourceRevision.revisionId, newDraftRevisionId: nextRevisionId }
        });
        logger_1.logger.info("Created rollback draft", { reqId: req.id, duration: Date.now() - start, newDraftRevisionId: nextRevisionId });
        res.status(201).json({ success: true, data: { message: "Rollback draft created successfully", revisionId: nextRevisionId } });
    }
    catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        logger_1.logger.error("Failed to rollback", { reqId: req.id, error: error.message });
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
exports.rollbackHomepageRevision = rollbackHomepageRevision;
const getAdminHomepageRevisionPreview = async (req, res) => {
    const start = Date.now();
    try {
        const revisionId = parseInt(req.params.revisionId, 10);
        if (isNaN(revisionId)) {
            return res.status(400).json({ success: false, error: { message: "Invalid revision ID" } });
        }
        const revision = await HomepageRevision_1.HomepageRevision.findOne({ revisionId, status: "published" }).lean();
        if (!revision) {
            return res.status(404).json({ success: false, error: { message: "Historical revision not found" } });
        }
        // Filter and sort exactly like the public endpoint would
        const sections = revision.sections
            .filter((s) => s.enabled)
            .sort((a, b) => a.order - b.order);
        logger_1.logger.info("Fetched historical revision preview", { reqId: req.id, duration: Date.now() - start, revisionId });
        res.status(200).json({ success: true, data: sections });
    }
    catch (error) {
        logger_1.logger.error("Failed to fetch historical revision preview", { reqId: req.id, error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getAdminHomepageRevisionPreview = getAdminHomepageRevisionPreview;
const scheduleAdminHomepage = async (req, res) => {
    const start = Date.now();
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const data = homepageSchedule_1.schedulePublishSchema.parse(req.body);
        const draft = await HomepageRevision_1.HomepageRevision.findOne({ status: "draft" }).session(session);
        if (!draft) {
            throw new Error("No active draft found.");
        }
        if (data.revisionId !== draft.revisionId) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ success: false, error: { code: "STALE_REVISION", message: "The draft has changed. Refresh before scheduling." } });
        }
        const existingSchedule = await HomepageRevision_1.HomepageRevision.findOne({ status: "scheduled" }).session(session);
        if (existingSchedule) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ success: false, error: { code: "SCHEDULE_EXISTS", message: "An active schedule already exists. Cancel it before scheduling a new one." } });
        }
        const scheduledCampaign = await HomepageCampaign_1.HomepageCampaign.findOne({ status: { $in: ["scheduled", "active"] } }).session(session);
        if (scheduledCampaign) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ success: false, error: { code: "CAMPAIGN_EXISTS", message: "A homepage campaign is currently scheduled or active. Cancel or complete it before scheduling." } });
        }
        // QA Gate
        const validation = await (0, homepageValidation_1.validateHomepageRevision)(draft);
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
        const nextRevisionId = await (0, Counter_1.getNextSequence)("homepageRevision", session);
        await HomepageRevision_1.HomepageRevision.create([{
                revisionId: nextRevisionId,
                status: "draft",
                sections: draft.sections.toObject()
            }], { session });
        await session.commitTransaction();
        session.endSession();
        await (0, audit_1.logHomepageMutation)({
            req,
            action: "SCHEDULE",
            metadata: { revisionId: draft.revisionId, nextRevisionId, scheduledPublishAt: draft.scheduledPublishAt }
        });
        logger_1.logger.info("Scheduled homepage publish", { reqId: req.id, duration: Date.now() - start, revisionId: draft.revisionId });
        res.status(200).json({ success: true, data: { message: "Scheduled successfully", revisionId: nextRevisionId } });
    }
    catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
        }
        logger_1.logger.error("Failed to schedule homepage", { reqId: req.id, error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.scheduleAdminHomepage = scheduleAdminHomepage;
const cancelAdminHomepageSchedule = async (req, res) => {
    const start = Date.now();
    try {
        const scheduled = await HomepageRevision_1.HomepageRevision.findOne({ status: "scheduled" });
        if (!scheduled) {
            return res.status(404).json({ success: false, error: { message: "No active schedule found." } });
        }
        scheduled.status = "cancelled";
        await scheduled.save();
        await (0, audit_1.logHomepageMutation)({
            req,
            action: "SCHEDULE_CANCEL",
            metadata: { revisionId: scheduled.revisionId }
        });
        logger_1.logger.info("Cancelled homepage schedule", { reqId: req.id, duration: Date.now() - start, revisionId: scheduled.revisionId });
        res.status(200).json({ success: true, data: { message: "Schedule cancelled successfully" } });
    }
    catch (error) {
        logger_1.logger.error("Failed to cancel homepage schedule", { reqId: req.id, error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.cancelAdminHomepageSchedule = cancelAdminHomepageSchedule;
const validateAdminHomepage = async (req, res) => {
    const start = Date.now();
    try {
        const revisionId = parseInt(req.body.revisionId, 10);
        if (isNaN(revisionId)) {
            return res.status(400).json({ success: false, error: { message: "Invalid revision ID" } });
        }
        const revision = await HomepageRevision_1.HomepageRevision.findOne({ revisionId }).lean();
        if (!revision) {
            return res.status(404).json({ success: false, error: { message: "Revision not found" } });
        }
        const result = await (0, homepageValidation_1.validateHomepageRevision)(revision);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        logger_1.logger.error("Failed to validate homepage revision", { reqId: req.id, error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.validateAdminHomepage = validateAdminHomepage;
