"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelAdminHomepageCampaign = exports.createAdminHomepageCampaign = exports.getAdminHomepageCampaignDetail = exports.getAdminHomepageCampaigns = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const HomepageCampaign_1 = require("../models/HomepageCampaign");
const HomepageRevision_1 = require("../models/HomepageRevision");
const HomepageAuditLog_1 = require("../models/HomepageAuditLog");
const socket_1 = require("../realtime/socket");
const logger_1 = require("../utils/logger");
const homepageMetrics_1 = require("../utils/homepageMetrics");
const homepageValidation_1 = require("../services/homepageValidation");
const triggerUpdateEvent = () => {
    (0, socket_1.emitToAll)("homepage_updated", { version: Date.now().toString() });
};
const getAdminHomepageCampaigns = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }
        const total = await HomepageCampaign_1.HomepageCampaign.countDocuments(filter);
        const campaigns = await HomepageCampaign_1.HomepageCampaign.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        res.status(200).json({
            success: true,
            data: campaigns,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        logger_1.logger.error("Failed to fetch homepage campaigns", { error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getAdminHomepageCampaigns = getAdminHomepageCampaigns;
const getAdminHomepageCampaignDetail = async (req, res) => {
    try {
        const { campaignKey } = req.params;
        const campaign = await HomepageCampaign_1.HomepageCampaign.findOne({ campaignKey }).lean();
        if (!campaign) {
            return res.status(404).json({ success: false, error: { message: "Campaign not found" } });
        }
        res.status(200).json({ success: true, data: campaign });
    }
    catch (error) {
        logger_1.logger.error("Failed to fetch homepage campaign detail", { error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getAdminHomepageCampaignDetail = getAdminHomepageCampaignDetail;
const createAdminHomepageCampaign = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const { campaignKey, name, description, revisionId, startsAt, endsAt, fallbackRevisionId } = req.body;
        const existingCampaign = await HomepageCampaign_1.HomepageCampaign.findOne({ campaignKey }).session(session);
        if (existingCampaign) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ success: false, error: { message: "Campaign key already exists" } });
        }
        // Verify revision is immutable and exists
        const revision = await HomepageRevision_1.HomepageRevision.findOne({ revisionId, status: { $in: ["published", "scheduled", "cancelled"] } }).session(session).lean();
        if (!revision) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, error: { message: "Invalid or mutable revisionId provided" } });
        }
        const revisionValidation = await (0, homepageValidation_1.validateHomepageRevision)(revision);
        if (!revisionValidation.valid) {
            await session.abortTransaction();
            session.endSession();
            return res.status(422).json({ success: false, error: { code: "CONTENT_VALIDATION_FAILED", message: "Target revision validation failed.", details: revisionValidation.errors, warnings: revisionValidation.warnings } });
        }
        if (fallbackRevisionId) {
            const fallback = await HomepageRevision_1.HomepageRevision.findOne({ revisionId: fallbackRevisionId, status: { $in: ["published", "scheduled", "cancelled"] } }).session(session).lean();
            if (!fallback) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ success: false, error: { message: "Invalid or mutable fallbackRevisionId provided" } });
            }
            const fallbackValidation = await (0, homepageValidation_1.validateHomepageRevision)(fallback);
            if (!fallbackValidation.valid) {
                await session.abortTransaction();
                session.endSession();
                return res.status(422).json({ success: false, error: { code: "CONTENT_VALIDATION_FAILED", message: "Fallback revision validation failed.", details: fallbackValidation.errors, warnings: fallbackValidation.warnings } });
            }
        }
        const scheduledRevision = await HomepageRevision_1.HomepageRevision.findOne({ status: "scheduled" }).session(session);
        if (scheduledRevision) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ success: false, error: { message: "A Phase 34 scheduled revision exists. Resolve it before creating a campaign." } });
        }
        const activeOrScheduledCampaign = await HomepageCampaign_1.HomepageCampaign.findOne({ status: { $in: ["active", "scheduled"] } }).session(session);
        if (activeOrScheduledCampaign) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ success: false, error: { message: "Another campaign is currently active or scheduled. Resolve it before creating a new campaign." } });
        }
        const status = startsAt ? "scheduled" : "draft";
        const newCampaign = await HomepageCampaign_1.HomepageCampaign.create([{
                campaignKey,
                name,
                description,
                revisionId,
                status,
                startsAt,
                endsAt,
                fallbackRevisionId,
                // @ts-ignore
                createdBy: req.user.userId,
                // @ts-ignore
                scheduledBy: startsAt ? req.user.userId : undefined,
            }], { session });
        await HomepageAuditLog_1.HomepageAuditLog.create([{
                action: "CAMPAIGN_CREATE",
                // @ts-ignore
                actorId: req.user.userId,
                // @ts-ignore
                actorRole: req.user.role,
                metadata: { campaignKey, revisionId, status, startsAt, endsAt }
            }], { session });
        await session.commitTransaction();
        session.endSession();
        (0, homepageMetrics_1.recordCampaignMetric)("created", false);
        res.status(201).json({ success: true, data: newCampaign[0] });
    }
    catch (error) {
        (0, homepageMetrics_1.recordCampaignMetric)("created", true);
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        logger_1.logger.error("Failed to create homepage campaign", { error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.createAdminHomepageCampaign = createAdminHomepageCampaign;
const cancelAdminHomepageCampaign = async (req, res) => {
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const { campaignKey } = req.params;
        const campaign = await HomepageCampaign_1.HomepageCampaign.findOne({ campaignKey }).session(session);
        if (!campaign) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, error: { message: "Campaign not found" } });
        }
        if (campaign.status === "cancelled" || campaign.status === "completed") {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, error: { message: "Campaign is already cancelled or completed" } });
        }
        if (campaign.status === "active") {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, error: { message: "Cannot cancel an active campaign. Please complete it or replace it via manual publish." } });
        }
        campaign.status = "cancelled";
        campaign.cancelledAt = new Date();
        await campaign.save({ session });
        await HomepageAuditLog_1.HomepageAuditLog.create([{
                action: "CAMPAIGN_CANCEL",
                // @ts-ignore
                actorId: req.user.userId,
                // @ts-ignore
                actorRole: req.user.role,
                metadata: { campaignKey, revisionId: campaign.revisionId }
            }], { session });
        await session.commitTransaction();
        session.endSession();
        (0, homepageMetrics_1.recordCampaignMetric)("cancelled", false);
        res.status(200).json({ success: true, data: { message: "Campaign cancelled successfully" } });
    }
    catch (error) {
        (0, homepageMetrics_1.recordCampaignMetric)("cancelled", true);
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();
        logger_1.logger.error("Failed to cancel homepage campaign", { error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.cancelAdminHomepageCampaign = cancelAdminHomepageCampaign;
