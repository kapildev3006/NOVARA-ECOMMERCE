"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomepageMetric = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const HomepageMetricSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
// Compound index for fast upserts and querying
HomepageMetricSchema.index({ bucketStart: 1, category: 1 }, { unique: true });
// TTL Index for automatic expiration (read from env or default to 90 days)
const retentionDays = parseInt(process.env.ANALYTICS_RETENTION_DAYS || "90", 10);
const retentionSeconds = retentionDays * 24 * 60 * 60;
HomepageMetricSchema.index({ bucketStart: 1 }, { expireAfterSeconds: retentionSeconds });
exports.HomepageMetric = mongoose_1.default.models.HomepageMetric || mongoose_1.default.model("HomepageMetric", HomepageMetricSchema);
