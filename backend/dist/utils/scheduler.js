"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopScheduler = exports.startScheduler = exports.runSchedulerTick = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const HomepageRevision_1 = require("../models/HomepageRevision");
const HomepageCampaign_1 = require("../models/HomepageCampaign");
const HomepageAuditLog_1 = require("../models/HomepageAuditLog");
const socket_1 = require("../realtime/socket");
const logger_1 = require("./logger");
const homepageService_1 = require("../services/homepageService");
const homepageMetrics_1 = require("./homepageMetrics");
const homepageValidation_1 = require("../services/homepageValidation");
let schedulerInterval = null;
let isExecuting = false;
const triggerUpdateEvent = () => {
    (0, socket_1.emitToAll)("homepage_updated", { version: Date.now().toString() });
};
const runSchedulerTick = async () => {
    if (isExecuting)
        return;
    isExecuting = true;
    try {
        const now = new Date();
        // 1. Process Phase 34 Revision Schedules
        const revJob = await HomepageRevision_1.HomepageRevision.findOneAndUpdate({ status: "scheduled", scheduledPublishAt: { $lte: now } }, { $set: { status: "executing" } }, { new: true });
        if (revJob) {
            const delayMs = Date.now() - revJob.scheduledPublishAt.getTime();
            logger_1.logger.info("Scheduler claimed a Phase 34 publish job", { revisionId: revJob.revisionId });
            const session = await mongoose_1.default.startSession();
            try {
                session.startTransaction();
                const revision = await HomepageRevision_1.HomepageRevision.findOne({ revisionId: revJob.revisionId }).session(session).lean();
                if (revision) {
                    const validation = await (0, homepageValidation_1.validateHomepageRevision)(revision);
                    if (!validation.valid) {
                        throw new Error(`Revision ${revJob.revisionId} failed execution-time validation`);
                    }
                }
                await (0, homepageService_1.applyRevisionToLiveHomepage)(revJob.revisionId, session);
                revJob.status = "published";
                revJob.publishedAt = new Date();
                await revJob.save({ session });
                await HomepageAuditLog_1.HomepageAuditLog.create([{
                        action: "SCHEDULE_EXECUTE",
                        actorRole: "System",
                        metadata: { revisionId: revJob.revisionId, scheduledPublishAt: revJob.scheduledPublishAt }
                    }], { session });
                await session.commitTransaction();
                session.endSession();
                logger_1.logger.info("Scheduler successfully published Phase 34 schedule", { revisionId: revJob.revisionId });
                (0, homepageMetrics_1.recordSchedulerMetric)(delayMs, false);
                triggerUpdateEvent();
            }
            catch (err) {
                if (session.inTransaction())
                    await session.abortTransaction();
                session.endSession();
                logger_1.logger.error("Phase 34 schedule transaction failed", { revisionId: revJob.revisionId, error: err.message });
                (0, homepageMetrics_1.recordSchedulerMetric)(delayMs, true);
                await HomepageRevision_1.HomepageRevision.updateOne({ _id: revJob._id }, { $set: { status: "scheduled" } });
            }
            return; // Only process one job per tick
        }
        // 2. Process Phase 35 Campaign Activations
        const activationJob = await HomepageCampaign_1.HomepageCampaign.findOneAndUpdate({ status: "scheduled", startsAt: { $lte: now } }, { $set: { status: "executing" } }, { new: true });
        if (activationJob) {
            const delayMs = Date.now() - activationJob.startsAt.getTime();
            logger_1.logger.info("Scheduler claimed a Campaign activation job", { campaignKey: activationJob.campaignKey });
            const session = await mongoose_1.default.startSession();
            try {
                session.startTransaction();
                const revision = await HomepageRevision_1.HomepageRevision.findOne({ revisionId: activationJob.revisionId }).session(session).lean();
                if (revision) {
                    const validation = await (0, homepageValidation_1.validateHomepageRevision)(revision);
                    if (!validation.valid) {
                        throw new Error(`Campaign activation for ${activationJob.campaignKey} failed execution-time validation`);
                    }
                }
                await (0, homepageService_1.applyRevisionToLiveHomepage)(activationJob.revisionId, session);
                activationJob.status = "active";
                activationJob.activatedAt = new Date();
                await activationJob.save({ session });
                await HomepageAuditLog_1.HomepageAuditLog.create([{
                        action: "CAMPAIGN_ACTIVATE",
                        actorRole: "System",
                        metadata: { campaignKey: activationJob.campaignKey, revisionId: activationJob.revisionId, activatedAt: activationJob.activatedAt }
                    }], { session });
                await session.commitTransaction();
                session.endSession();
                logger_1.logger.info("Scheduler successfully activated Campaign", { campaignKey: activationJob.campaignKey });
                (0, homepageMetrics_1.recordSchedulerMetric)(delayMs, false);
                (0, homepageMetrics_1.recordCampaignMetric)("activated", false);
                triggerUpdateEvent();
            }
            catch (err) {
                if (session.inTransaction())
                    await session.abortTransaction();
                session.endSession();
                logger_1.logger.error("Campaign activation transaction failed", { campaignKey: activationJob.campaignKey, error: err.message });
                (0, homepageMetrics_1.recordSchedulerMetric)(delayMs, true);
                (0, homepageMetrics_1.recordCampaignMetric)("activated", true);
                await HomepageCampaign_1.HomepageCampaign.updateOne({ _id: activationJob._id }, { $set: { status: "scheduled" } });
            }
            return;
        }
        // 3. Process Phase 35 Campaign Completions
        const completionJob = await HomepageCampaign_1.HomepageCampaign.findOneAndUpdate({ status: "active", endsAt: { $lte: now } }, { $set: { status: "executing" } }, { new: true });
        if (completionJob) {
            const delayMs = Date.now() - completionJob.endsAt.getTime();
            logger_1.logger.info("Scheduler claimed a Campaign completion job", { campaignKey: completionJob.campaignKey });
            const session = await mongoose_1.default.startSession();
            try {
                session.startTransaction();
                if (!completionJob.fallbackRevisionId) {
                    throw new Error("Cannot complete campaign: missing fallbackRevisionId");
                }
                const fallback = await HomepageRevision_1.HomepageRevision.findOne({ revisionId: completionJob.fallbackRevisionId }).session(session).lean();
                if (fallback) {
                    const validation = await (0, homepageValidation_1.validateHomepageRevision)(fallback);
                    if (!validation.valid) {
                        throw new Error(`Campaign completion fallback for ${completionJob.campaignKey} failed execution-time validation`);
                    }
                }
                // Apply fallback
                await (0, homepageService_1.applyRevisionToLiveHomepage)(completionJob.fallbackRevisionId, session);
                completionJob.status = "completed";
                completionJob.completedAt = new Date();
                await completionJob.save({ session });
                await HomepageAuditLog_1.HomepageAuditLog.create([{
                        action: "CAMPAIGN_COMPLETE",
                        actorRole: "System",
                        metadata: { campaignKey: completionJob.campaignKey, fallbackRevisionId: completionJob.fallbackRevisionId, completedAt: completionJob.completedAt }
                    }], { session });
                await session.commitTransaction();
                session.endSession();
                logger_1.logger.info("Scheduler successfully completed Campaign", { campaignKey: completionJob.campaignKey });
                (0, homepageMetrics_1.recordSchedulerMetric)(delayMs, false);
                (0, homepageMetrics_1.recordCampaignMetric)("completed", false);
                triggerUpdateEvent();
            }
            catch (err) {
                if (session.inTransaction())
                    await session.abortTransaction();
                session.endSession();
                logger_1.logger.error("Campaign completion transaction failed", { campaignKey: completionJob.campaignKey, error: err.message });
                (0, homepageMetrics_1.recordSchedulerMetric)(delayMs, true);
                (0, homepageMetrics_1.recordCampaignMetric)("completed", true);
                // Critical: Do not reset to active if we failed to apply fallback due to bad fallback data,
                // otherwise it will retry infinitely. BUT since we need safe recovery, resetting to 'active' is the instruction requirement.
                // "If fallback validation fails: do NOT mark campaign completed, record operational failure, leave live state intact"
                await HomepageCampaign_1.HomepageCampaign.updateOne({ _id: completionJob._id }, { $set: { status: "active" } });
            }
            return;
        }
    }
    catch (error) {
        logger_1.logger.error("Scheduler generic error", { error: error.message });
    }
    finally {
        isExecuting = false;
    }
};
exports.runSchedulerTick = runSchedulerTick;
const startScheduler = () => {
    if (schedulerInterval)
        return;
    logger_1.logger.info("Starting background scheduler...");
    // Polling every 15 seconds
    schedulerInterval = setInterval(exports.runSchedulerTick, 15000);
};
exports.startScheduler = startScheduler;
const stopScheduler = () => {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        logger_1.logger.info("Stopped background scheduler");
    }
};
exports.stopScheduler = stopScheduler;
