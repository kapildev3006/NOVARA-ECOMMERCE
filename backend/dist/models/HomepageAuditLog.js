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
exports.HomepageAuditLog = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const env_1 = require("../config/env");
const HomepageAuditLogSchema = new mongoose_1.Schema({
    action: {
        type: String,
        enum: ["CREATE", "UPDATE", "DELETE", "REORDER", "SEED", "PUBLISH", "ROLLBACK", "SCHEDULE", "SCHEDULE_CANCEL", "SCHEDULE_EXECUTE", "CAMPAIGN_CREATE", "CAMPAIGN_UPDATE", "CAMPAIGN_CANCEL", "CAMPAIGN_ACTIVATE", "CAMPAIGN_COMPLETE", "PERMISSION_GRANT", "PERMISSION_REVOKE", "MEDIA_UPLOAD", "MEDIA_UPDATE", "MEDIA_DELETE"],
        required: true,
    },
    sectionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "HomepageSection",
        required: false,
    },
    sectionKey: {
        type: String,
        required: false,
    },
    actorId: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false,
    },
    actorRole: {
        type: String,
        required: false,
    },
    changes: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
// Calculate TTL in seconds based on retention days configuration
const retentionSeconds = Number(env_1.config.AUDIT_LOG_RETENTION_DAYS) * 24 * 60 * 60;
// TTL Index for automatic pruning of old operational audit logs
HomepageAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: retentionSeconds });
// Filtering/Pagination Indexes
HomepageAuditLogSchema.index({ sectionId: 1, createdAt: -1 });
HomepageAuditLogSchema.index({ actorId: 1, createdAt: -1 });
HomepageAuditLogSchema.index({ createdAt: -1 }); // Used for generic GET /audit
exports.HomepageAuditLog = mongoose_1.default.model("HomepageAuditLog", HomepageAuditLogSchema);
