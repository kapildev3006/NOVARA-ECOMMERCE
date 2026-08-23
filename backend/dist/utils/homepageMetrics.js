"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordQaMetric = exports.recordErrorMetric = exports.recordFallbackMetric = exports.recordSocketMetric = exports.recordMediaMetric = exports.recordCampaignMetric = exports.recordSchedulerMetric = exports.recordPublishMetric = exports.recordHomepageMetric = void 0;
exports.recordMetric = recordMetric;
const HomepageMetric_1 = require("../models/HomepageMetric");
const logger_1 = require("./logger");
function getCurrentBucketStart() {
    const now = new Date();
    now.setUTCMinutes(0, 0, 0);
    return now;
}
async function recordMetric({ category, increments }) {
    try {
        const bucketStart = getCurrentBucketStart();
        await HomepageMetric_1.HomepageMetric.updateOne({ bucketStart, category }, { $inc: increments }, { upsert: true }).catch((err) => {
            logger_1.logger.error("Failed to update homepage metric", { error: err.message, category, increments });
        });
    }
    catch (error) {
        logger_1.logger.error("Unhandled error in recordMetric", { error: error.message });
    }
}
const recordHomepageMetric = (durationMs, isError, isSlow) => {
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
exports.recordHomepageMetric = recordHomepageMetric;
const recordPublishMetric = (durationMs, isError) => {
    recordMetric({
        category: "publishing",
        increments: {
            publishCount: 1,
            publishFailureCount: isError ? 1 : 0,
            publishDurationMs: durationMs,
        }
    });
};
exports.recordPublishMetric = recordPublishMetric;
const recordSchedulerMetric = (delayMs, isError) => {
    recordMetric({
        category: "scheduler",
        increments: {
            schedulerExecutedCount: 1,
            schedulerFailureCount: isError ? 1 : 0,
            schedulerDelayMsTotal: delayMs,
        }
    });
};
exports.recordSchedulerMetric = recordSchedulerMetric;
const recordCampaignMetric = (action, isError = false) => {
    const increments = {};
    if (isError) {
        increments.campaignFailureCount = 1;
    }
    else {
        if (action === "created")
            increments.campaignCreatedCount = 1;
        if (action === "activated")
            increments.campaignActivatedCount = 1;
        if (action === "completed")
            increments.campaignCompletedCount = 1;
        if (action === "cancelled")
            increments.campaignCancelledCount = 1;
    }
    recordMetric({ category: "campaigns", increments });
};
exports.recordCampaignMetric = recordCampaignMetric;
const recordMediaMetric = (action, isError = false, bytes = 0) => {
    const increments = {};
    if (isError) {
        increments.mediaFailureCount = 1;
    }
    else {
        if (action === "upload")
            increments.mediaUploadCount = 1;
        if (action === "update")
            increments.mediaUpdateCount = 1;
        if (action === "delete")
            increments.mediaDeleteCount = 1;
        if (bytes > 0)
            increments.totalUploadBytes = bytes;
    }
    recordMetric({ category: "media", increments });
};
exports.recordMediaMetric = recordMediaMetric;
const recordSocketMetric = (action) => {
    const increments = {};
    if (action === "emitted")
        increments.socketEmittedCount = 1;
    if (action === "refetch")
        increments.socketRefetchCount = 1;
    recordMetric({ category: "socket", increments });
};
exports.recordSocketMetric = recordSocketMetric;
const recordFallbackMetric = () => {
    recordMetric({ category: "fallbacks", increments: { fallbackCount: 1 } });
};
exports.recordFallbackMetric = recordFallbackMetric;
const recordErrorMetric = (errorType) => {
    const validErrors = ["validation_error", "authorization_error", "not_found", "conflict", "database_error", "cloudinary_error", "timeout", "network_error", "unknown", "content_validation_error"];
    const type = validErrors.includes(errorType) ? errorType : "unknown";
    recordMetric({ category: "errors", increments: { [type]: 1 } });
};
exports.recordErrorMetric = recordErrorMetric;
const recordQaMetric = (errors, warnings) => {
    const increments = {
        qaRuns: 1,
    };
    if (errors > 0)
        increments.qaFailures = 1;
    if (warnings > 0)
        increments.qaWarnings = 1;
    recordMetric({ category: "qa", increments });
};
exports.recordQaMetric = recordQaMetric;
