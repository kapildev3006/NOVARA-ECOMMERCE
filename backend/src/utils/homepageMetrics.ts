import { HomepageMetric } from "../models/HomepageMetric";
import { logger } from "./logger";

function getCurrentBucketStart(): Date {
  const now = new Date();
  now.setUTCMinutes(0, 0, 0);
  return now;
}

interface IncrementData {
  category: "homepage" | "publishing" | "scheduler" | "campaigns" | "media" | "socket" | "errors" | "fallbacks" | "qa";
  increments: Record<string, number>;
}

export async function recordMetric({ category, increments }: IncrementData): Promise<void> {
  try {
    const bucketStart = getCurrentBucketStart();
    await HomepageMetric.updateOne(
      { bucketStart, category },
      { $inc: increments },
      { upsert: true }
    ).catch((err) => {
      logger.error("Failed to update homepage metric", { error: err.message, category, increments });
    });
  } catch (error: any) {
    logger.error("Unhandled error in recordMetric", { error: error.message });
  }
}

export const recordHomepageMetric = (durationMs: number, isError: boolean, isSlow: boolean) => {
  recordMetric({
    category: "homepage",
    increments: {
      requestCount: 1,
      errorCount: isError ? 1 : 0,
      totalLatencyMs: durationMs,
      slowRequestCount: isSlow ? 1 : 0,
    }
  });
};

export const recordPublishMetric = (durationMs: number, isError: boolean) => {
  recordMetric({
    category: "publishing",
    increments: {
      publishCount: 1,
      publishFailureCount: isError ? 1 : 0,
      publishDurationMs: durationMs,
    }
  });
};

export const recordSchedulerMetric = (delayMs: number, isError: boolean) => {
  recordMetric({
    category: "scheduler",
    increments: {
      schedulerExecutedCount: 1,
      schedulerFailureCount: isError ? 1 : 0,
      schedulerDelayMsTotal: delayMs,
    }
  });
};

export const recordCampaignMetric = (action: "created" | "activated" | "completed" | "cancelled", isError: boolean = false) => {
  const increments: Record<string, number> = {};
  if (isError) {
    increments.campaignFailureCount = 1;
  } else {
    if (action === "created") increments.campaignCreatedCount = 1;
    if (action === "activated") increments.campaignActivatedCount = 1;
    if (action === "completed") increments.campaignCompletedCount = 1;
    if (action === "cancelled") increments.campaignCancelledCount = 1;
  }
  recordMetric({ category: "campaigns", increments });
};

export const recordMediaMetric = (action: "upload" | "update" | "delete", isError: boolean = false, bytes: number = 0) => {
  const increments: Record<string, number> = {};
  if (isError) {
    increments.mediaFailureCount = 1;
  } else {
    if (action === "upload") increments.mediaUploadCount = 1;
    if (action === "update") increments.mediaUpdateCount = 1;
    if (action === "delete") increments.mediaDeleteCount = 1;
    if (bytes > 0) increments.totalUploadBytes = bytes;
  }
  recordMetric({ category: "media", increments });
};

export const recordSocketMetric = (action: "emitted" | "refetch") => {
  const increments: Record<string, number> = {};
  if (action === "emitted") increments.socketEmittedCount = 1;
  if (action === "refetch") increments.socketRefetchCount = 1;
  recordMetric({ category: "socket", increments });
};

export const recordFallbackMetric = () => {
  recordMetric({ category: "fallbacks", increments: { fallbackCount: 1 } });
};

export const recordErrorMetric = (errorType: string) => {
  const validErrors = ["validation_error", "authorization_error", "not_found", "conflict", "database_error", "cloudinary_error", "timeout", "network_error", "unknown", "content_validation_error"];
  const type = validErrors.includes(errorType) ? errorType : "unknown";
  recordMetric({ category: "errors", increments: { [type]: 1 } });
};

export const recordQaMetric = (errors: number, warnings: number) => {
  const increments: Record<string, number> = {
    qaRuns: 1,
  };
  if (errors > 0) increments.qaFailures = 1;
  if (warnings > 0) increments.qaWarnings = 1;
  recordMetric({ category: "qa", increments });
};
