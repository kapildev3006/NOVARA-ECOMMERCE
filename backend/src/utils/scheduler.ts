import mongoose from "mongoose";
import { HomepageRevision } from "../models/HomepageRevision";
import { HomepageCampaign } from "../models/HomepageCampaign";
import { HomepageAuditLog } from "../models/HomepageAuditLog";
import { emitToAll } from "../realtime/socket";
import { logger } from "./logger";
import { applyRevisionToLiveHomepage } from "../services/homepageService";
import { recordSchedulerMetric, recordCampaignMetric } from "./homepageMetrics";
import { validateHomepageRevision } from "../services/homepageValidation";

let schedulerInterval: NodeJS.Timeout | null = null;
let isExecuting = false;

const triggerUpdateEvent = () => {
  emitToAll("homepage_updated", { version: Date.now().toString() });
};

export const runSchedulerTick = async () => {
  if (isExecuting) return;
  isExecuting = true;

  try {
    const now = new Date();

    // 1. Process Phase 34 Revision Schedules
    const revJob = await HomepageRevision.findOneAndUpdate(
      { status: "scheduled", scheduledPublishAt: { $lte: now } },
      { $set: { status: "executing" } },
      { new: true }
    );

    if (revJob) {
      const delayMs = Date.now() - revJob.scheduledPublishAt.getTime();
      logger.info("Scheduler claimed a Phase 34 publish job", { revisionId: revJob.revisionId });
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const revision = await HomepageRevision.findOne({ revisionId: revJob.revisionId }).session(session).lean();
        if (revision) {
          const validation = await validateHomepageRevision(revision);
          if (!validation.valid) {
            throw new Error(`Revision ${revJob.revisionId} failed execution-time validation`);
          }
        }

        await applyRevisionToLiveHomepage(revJob.revisionId, session);

        revJob.status = "published";
        revJob.publishedAt = new Date();
        await revJob.save({ session });

        await HomepageAuditLog.create([{
          action: "SCHEDULE_EXECUTE",
          actorRole: "System",
          metadata: { revisionId: revJob.revisionId, scheduledPublishAt: revJob.scheduledPublishAt }
        }], { session });

        await session.commitTransaction();
        session.endSession();

        logger.info("Scheduler successfully published Phase 34 schedule", { revisionId: revJob.revisionId });
        recordSchedulerMetric(delayMs, false);
        triggerUpdateEvent();
      } catch (err: any) {
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        logger.error("Phase 34 schedule transaction failed", { revisionId: revJob.revisionId, error: err.message });
        recordSchedulerMetric(delayMs, true);
        await HomepageRevision.updateOne({ _id: revJob._id }, { $set: { status: "scheduled" } });
      }
      return; // Only process one job per tick
    }

    // 2. Process Phase 35 Campaign Activations
    const activationJob = await HomepageCampaign.findOneAndUpdate(
      { status: "scheduled", startsAt: { $lte: now } },
      { $set: { status: "executing" } },
      { new: true }
    );

    if (activationJob) {
      const delayMs = Date.now() - activationJob.startsAt.getTime();
      logger.info("Scheduler claimed a Campaign activation job", { campaignKey: activationJob.campaignKey });
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const revision = await HomepageRevision.findOne({ revisionId: activationJob.revisionId }).session(session).lean();
        if (revision) {
          const validation = await validateHomepageRevision(revision);
          if (!validation.valid) {
            throw new Error(`Campaign activation for ${activationJob.campaignKey} failed execution-time validation`);
          }
        }

        await applyRevisionToLiveHomepage(activationJob.revisionId, session);

        activationJob.status = "active";
        activationJob.activatedAt = new Date();
        await activationJob.save({ session });

        await HomepageAuditLog.create([{
          action: "CAMPAIGN_ACTIVATE",
          actorRole: "System",
          metadata: { campaignKey: activationJob.campaignKey, revisionId: activationJob.revisionId, activatedAt: activationJob.activatedAt }
        }], { session });

        await session.commitTransaction();
        session.endSession();

        logger.info("Scheduler successfully activated Campaign", { campaignKey: activationJob.campaignKey });
        recordSchedulerMetric(delayMs, false);
        recordCampaignMetric("activated", false);
        triggerUpdateEvent();
      } catch (err: any) {
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        logger.error("Campaign activation transaction failed", { campaignKey: activationJob.campaignKey, error: err.message });
        recordSchedulerMetric(delayMs, true);
        recordCampaignMetric("activated", true);
        await HomepageCampaign.updateOne({ _id: activationJob._id }, { $set: { status: "scheduled" } });
      }
      return;
    }

    // 3. Process Phase 35 Campaign Completions
    const completionJob = await HomepageCampaign.findOneAndUpdate(
      { status: "active", endsAt: { $lte: now } },
      { $set: { status: "executing" } },
      { new: true }
    );

    if (completionJob) {
      const delayMs = Date.now() - completionJob.endsAt.getTime();
      logger.info("Scheduler claimed a Campaign completion job", { campaignKey: completionJob.campaignKey });
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        if (!completionJob.fallbackRevisionId) {
          throw new Error("Cannot complete campaign: missing fallbackRevisionId");
        }

        const fallback = await HomepageRevision.findOne({ revisionId: completionJob.fallbackRevisionId }).session(session).lean();
        if (fallback) {
          const validation = await validateHomepageRevision(fallback);
          if (!validation.valid) {
            throw new Error(`Campaign completion fallback for ${completionJob.campaignKey} failed execution-time validation`);
          }
        }

        // Apply fallback
        await applyRevisionToLiveHomepage(completionJob.fallbackRevisionId, session);

        completionJob.status = "completed";
        completionJob.completedAt = new Date();
        await completionJob.save({ session });

        await HomepageAuditLog.create([{
          action: "CAMPAIGN_COMPLETE",
          actorRole: "System",
          metadata: { campaignKey: completionJob.campaignKey, fallbackRevisionId: completionJob.fallbackRevisionId, completedAt: completionJob.completedAt }
        }], { session });

        await session.commitTransaction();
        session.endSession();

        logger.info("Scheduler successfully completed Campaign", { campaignKey: completionJob.campaignKey });
        recordSchedulerMetric(delayMs, false);
        recordCampaignMetric("completed", false);
        triggerUpdateEvent();
      } catch (err: any) {
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        logger.error("Campaign completion transaction failed", { campaignKey: completionJob.campaignKey, error: err.message });
        recordSchedulerMetric(delayMs, true);
        recordCampaignMetric("completed", true);
        
        // Critical: Do not reset to active if we failed to apply fallback due to bad fallback data,
        // otherwise it will retry infinitely. BUT since we need safe recovery, resetting to 'active' is the instruction requirement.
        // "If fallback validation fails: do NOT mark campaign completed, record operational failure, leave live state intact"
        await HomepageCampaign.updateOne({ _id: completionJob._id }, { $set: { status: "active" } });
      }
      return;
    }

  } catch (error: any) {
    logger.error("Scheduler generic error", { error: error.message });
  } finally {
    isExecuting = false;
  }
};

export const startScheduler = () => {
  if (schedulerInterval) return;
  logger.info("Starting background scheduler...");
  // Polling every 15 seconds
  schedulerInterval = setInterval(runSchedulerTick, 15000);
};

export const stopScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info("Stopped background scheduler");
  }
};
