"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomepageAnalytics = void 0;
const HomepageMetric_1 = require("../models/HomepageMetric");
const logger_1 = require("../utils/logger");
const getHomepageAnalytics = async (req, res) => {
    try {
        const rangeParam = req.query.range || "24h";
        let hoursToLookBack = 24;
        switch (rangeParam) {
            case "1h":
                hoursToLookBack = 1;
                break;
            case "24h":
                hoursToLookBack = 24;
                break;
            case "7d":
                hoursToLookBack = 24 * 7;
                break;
            case "30d":
                hoursToLookBack = 24 * 30;
                break;
            default: return res.status(400).json({ success: false, error: { message: "Invalid range parameter. Supported values: 1h, 24h, 7d, 30d" } });
        }
        const now = new Date();
        const startTime = new Date(now.getTime() - hoursToLookBack * 60 * 60 * 1000);
        const metrics = await HomepageMetric_1.HomepageMetric.find({ bucketStart: { $gte: startTime } }).lean();
        const result = {
            range: rangeParam,
            homepage: {
                requests: 0,
                errors: 0,
                averageLatencyMs: 0,
                slowRequests: 0,
                fallbacks: 0,
            },
            publishing: {
                publishes: 0,
                failures: 0,
                averageDurationMs: 0,
            },
            scheduler: {
                executed: 0,
                failures: 0,
                averageDelayMs: 0,
            },
            campaigns: {
                created: 0,
                activated: 0,
                completed: 0,
                cancelled: 0,
                failures: 0,
            },
            media: {
                uploads: 0,
                updates: 0,
                deletes: 0,
                failures: 0,
            },
            errors: {},
            socket: {
                emitted: 0,
                refetches: 0,
            }
        };
        let totalLatencyMs = 0;
        let publishDurationMs = 0;
        let schedulerDelayMsTotal = 0;
        for (const m of metrics) {
            if (m.category === "homepage") {
                result.homepage.requests += m.requestCount || 0;
                result.homepage.errors += m.errorCount || 0;
                result.homepage.slowRequests += m.slowRequestCount || 0;
                totalLatencyMs += m.totalLatencyMs || 0;
            }
            else if (m.category === "fallbacks") {
                result.homepage.fallbacks += m.fallbackCount || 0;
            }
            else if (m.category === "publishing") {
                result.publishing.publishes += m.publishCount || 0;
                result.publishing.failures += m.publishFailureCount || 0;
                publishDurationMs += m.publishDurationMs || 0;
            }
            else if (m.category === "scheduler") {
                result.scheduler.executed += m.schedulerExecutedCount || 0;
                result.scheduler.failures += m.schedulerFailureCount || 0;
                schedulerDelayMsTotal += m.schedulerDelayMsTotal || 0;
            }
            else if (m.category === "campaigns") {
                result.campaigns.created += m.campaignCreatedCount || 0;
                result.campaigns.activated += m.campaignActivatedCount || 0;
                result.campaigns.completed += m.campaignCompletedCount || 0;
                result.campaigns.cancelled += m.campaignCancelledCount || 0;
                result.campaigns.failures += m.campaignFailureCount || 0;
            }
            else if (m.category === "media") {
                result.media.uploads += m.mediaUploadCount || 0;
                result.media.updates += m.mediaUpdateCount || 0;
                result.media.deletes += m.mediaDeleteCount || 0;
                result.media.failures += m.mediaFailureCount || 0;
            }
            else if (m.category === "socket") {
                result.socket.emitted += m.socketEmittedCount || 0;
                result.socket.refetches += m.socketRefetchCount || 0;
            }
            else if (m.category === "errors") {
                // Just sum the known fields generically
                const errs = m;
                const types = ["validation_error", "authorization_error", "not_found", "conflict", "database_error", "cloudinary_error", "timeout", "network_error", "unknown"];
                for (const t of types) {
                    if (errs[t]) {
                        result.errors[t] = (result.errors[t] || 0) + errs[t];
                    }
                }
            }
        }
        if (result.homepage.requests > 0) {
            result.homepage.averageLatencyMs = Math.round(totalLatencyMs / result.homepage.requests);
        }
        if (result.publishing.publishes > 0) {
            result.publishing.averageDurationMs = Math.round(publishDurationMs / result.publishing.publishes);
        }
        if (result.scheduler.executed > 0) {
            result.scheduler.averageDelayMs = Math.round(schedulerDelayMsTotal / result.scheduler.executed);
        }
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        logger_1.logger.error("Failed to fetch homepage analytics", { error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getHomepageAnalytics = getHomepageAnalytics;
