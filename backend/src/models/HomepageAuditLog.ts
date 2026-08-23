import mongoose, { Document, Schema } from "mongoose";
import { config } from "../config/env";

export interface IHomepageAuditLog extends Document {
  action: "CREATE" | "UPDATE" | "DELETE" | "REORDER" | "SEED" | "PUBLISH" | "ROLLBACK" | "SCHEDULE" | "SCHEDULE_CANCEL" | "SCHEDULE_EXECUTE" | "CAMPAIGN_CREATE" | "CAMPAIGN_UPDATE" | "CAMPAIGN_CANCEL" | "CAMPAIGN_ACTIVATE" | "CAMPAIGN_COMPLETE" | "PERMISSION_GRANT" | "PERMISSION_REVOKE" | "MEDIA_UPLOAD" | "MEDIA_UPDATE" | "MEDIA_DELETE";
  sectionId?: mongoose.Types.ObjectId;
  sectionKey?: string;
  actorId?: mongoose.Types.ObjectId | string;
  actorRole?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const HomepageAuditLogSchema = new Schema<IHomepageAuditLog>({
  action: {
    type: String,
    enum: ["CREATE", "UPDATE", "DELETE", "REORDER", "SEED", "PUBLISH", "ROLLBACK", "SCHEDULE", "SCHEDULE_CANCEL", "SCHEDULE_EXECUTE", "CAMPAIGN_CREATE", "CAMPAIGN_UPDATE", "CAMPAIGN_CANCEL", "CAMPAIGN_ACTIVATE", "CAMPAIGN_COMPLETE", "PERMISSION_GRANT", "PERMISSION_REVOKE", "MEDIA_UPLOAD", "MEDIA_UPDATE", "MEDIA_DELETE"],
    required: true,
  },
  sectionId: {
    type: Schema.Types.ObjectId,
    ref: "HomepageSection",
    required: false,
  },
  sectionKey: {
    type: String,
    required: false,
  },
  actorId: {
    type: Schema.Types.Mixed,
    required: false,
  },
  actorRole: {
    type: String,
    required: false,
  },
  changes: {
    type: Schema.Types.Mixed,
    required: false,
  },
  metadata: {
    type: Schema.Types.Mixed,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate TTL in seconds based on retention days configuration
const retentionSeconds = Number(config.AUDIT_LOG_RETENTION_DAYS) * 24 * 60 * 60;

// TTL Index for automatic pruning of old operational audit logs
HomepageAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: retentionSeconds });

// Filtering/Pagination Indexes
HomepageAuditLogSchema.index({ sectionId: 1, createdAt: -1 });
HomepageAuditLogSchema.index({ actorId: 1, createdAt: -1 });
HomepageAuditLogSchema.index({ createdAt: -1 }); // Used for generic GET /audit

export const HomepageAuditLog = mongoose.model<IHomepageAuditLog>("HomepageAuditLog", HomepageAuditLogSchema);
