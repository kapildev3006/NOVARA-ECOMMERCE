import mongoose, { Document, Schema } from "mongoose";

export interface IHomepageMetric extends Document {
  bucketStart: Date;
  category: "homepage" | "publishing" | "scheduler" | "campaigns" | "media" | "socket" | "errors" | "fallbacks";

  // homepage
  requestCount?: number;
  errorCount?: number;
  totalLatencyMs?: number;
  slowRequestCount?: number;

  // fallbacks
  fallbackCount?: number;

  // publishing
  publishCount?: number;
  publishFailureCount?: number;
  publishDurationMs?: number;

  // scheduler
  schedulerExecutedCount?: number;
  schedulerFailureCount?: number;
  schedulerDelayMsTotal?: number;

  // campaigns
  campaignCreatedCount?: number;
  campaignActivatedCount?: number;
  campaignCompletedCount?: number;
  campaignCancelledCount?: number;
  campaignFailureCount?: number;

  // media
  mediaUploadCount?: number;
  mediaUpdateCount?: number;
  mediaDeleteCount?: number;
  mediaFailureCount?: number;
  totalUploadBytes?: number;

  // socket
  socketEmittedCount?: number;
  socketRefetchCount?: number;

  // errors
  validation_error?: number;
  authorization_error?: number;
  not_found?: number;
  conflict?: number;
  database_error?: number;
  cloudinary_error?: number;
  timeout?: number;
  network_error?: number;
  unknown?: number;
}

const HomepageMetricSchema = new Schema<IHomepageMetric>(
  {
    bucketStart: { type: Date, required: true },
    category: { type: String, required: true },
    
    requestCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    totalLatencyMs: { type: Number, default: 0 },
    slowRequestCount: { type: Number, default: 0 },

    fallbackCount: { type: Number, default: 0 },

    publishCount: { type: Number, default: 0 },
    publishFailureCount: { type: Number, default: 0 },
    publishDurationMs: { type: Number, default: 0 },

    schedulerExecutedCount: { type: Number, default: 0 },
    schedulerFailureCount: { type: Number, default: 0 },
    schedulerDelayMsTotal: { type: Number, default: 0 },

    campaignCreatedCount: { type: Number, default: 0 },
    campaignActivatedCount: { type: Number, default: 0 },
    campaignCompletedCount: { type: Number, default: 0 },
    campaignCancelledCount: { type: Number, default: 0 },
    campaignFailureCount: { type: Number, default: 0 },

    mediaUploadCount: { type: Number, default: 0 },
    mediaUpdateCount: { type: Number, default: 0 },
    mediaDeleteCount: { type: Number, default: 0 },
    mediaFailureCount: { type: Number, default: 0 },
    totalUploadBytes: { type: Number, default: 0 },

    socketEmittedCount: { type: Number, default: 0 },
    socketRefetchCount: { type: Number, default: 0 },

    validation_error: { type: Number, default: 0 },
    authorization_error: { type: Number, default: 0 },
    not_found: { type: Number, default: 0 },
    conflict: { type: Number, default: 0 },
    database_error: { type: Number, default: 0 },
    cloudinary_error: { type: Number, default: 0 },
    timeout: { type: Number, default: 0 },
    network_error: { type: Number, default: 0 },
    unknown: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for fast upserts and querying
HomepageMetricSchema.index({ bucketStart: 1, category: 1 }, { unique: true });

// TTL Index for automatic expiration (read from env or default to 90 days)
const retentionDays = parseInt(process.env.ANALYTICS_RETENTION_DAYS || "90", 10);
const retentionSeconds = retentionDays * 24 * 60 * 60;
HomepageMetricSchema.index({ bucketStart: 1 }, { expireAfterSeconds: retentionSeconds });

export const HomepageMetric = mongoose.models.HomepageMetric || mongoose.model<IHomepageMetric>("HomepageMetric", HomepageMetricSchema);
