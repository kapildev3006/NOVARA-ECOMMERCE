"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logHomepageMutation = void 0;
const HomepageAuditLog_1 = require("../models/HomepageAuditLog");
const logger_1 = require("./logger");
const logHomepageMutation = async (params) => {
    try {
        const { req, action, sectionId, sectionKey, changes, metadata } = params;
        // Extract actor information from req.user (populated by auth middleware)
        const actorId = req.user?.userId || "system";
        const actorRole = req.user?.role || "system";
        await HomepageAuditLog_1.HomepageAuditLog.create({
            action,
            sectionId,
            sectionKey,
            actorId,
            actorRole,
            changes,
            metadata,
        });
        logger_1.logger.info(`Homepage audit log created: ${action}`, { reqId: req.id, sectionId, sectionKey, actorId });
    }
    catch (error) {
        // Non-blocking: We only log the failure, we do NOT throw it to the caller
        logger_1.logger.error(`Failed to create homepage audit log for ${params.action}`, {
            reqId: params.req.id,
            error: error.message,
        });
    }
};
exports.logHomepageMutation = logHomepageMutation;
