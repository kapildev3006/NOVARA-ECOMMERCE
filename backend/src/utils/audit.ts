import { HomepageAuditLog } from "../models/HomepageAuditLog";
import { logger } from "./logger";
import { Request } from "express";
import mongoose from "mongoose";

interface AuditLogParams {
  req: Request;
  action: "CREATE" | "UPDATE" | "DELETE" | "REORDER" | "SEED" | "PUBLISH" | "ROLLBACK" | "SCHEDULE" | "SCHEDULE_CANCEL" | "SCHEDULE_EXECUTE" | "CAMPAIGN_CREATE" | "CAMPAIGN_UPDATE" | "CAMPAIGN_CANCEL" | "CAMPAIGN_ACTIVATE" | "CAMPAIGN_COMPLETE" | "PERMISSION_GRANT" | "PERMISSION_REVOKE" | "MEDIA_UPLOAD" | "MEDIA_UPDATE" | "MEDIA_DELETE";
  sectionId?: mongoose.Types.ObjectId | string;
  sectionKey?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export const logHomepageMutation = async (params: AuditLogParams) => {
  try {
    const { req, action, sectionId, sectionKey, changes, metadata } = params;
    
    // Extract actor information from req.user (populated by auth middleware)
    const actorId = req.user?.userId || "system";
    const actorRole = req.user?.role || "system";

    await HomepageAuditLog.create({
      action,
      sectionId,
      sectionKey,
      actorId,
      actorRole,
      changes,
      metadata,
    });

    logger.info(`Homepage audit log created: ${action}`, { reqId: req.id, sectionId, sectionKey, actorId });
  } catch (error: any) {
    // Non-blocking: We only log the failure, we do NOT throw it to the caller
    logger.error(`Failed to create homepage audit log for ${params.action}`, {
      reqId: params.req.id,
      error: error.message,
    });
  }
};
