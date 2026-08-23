"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomepageAuditLogs = void 0;
const HomepageAuditLog_1 = require("../models/HomepageAuditLog");
const homepageAudit_1 = require("../validators/homepageAudit");
const logger_1 = require("../utils/logger");
const getHomepageAuditLogs = async (req, res) => {
    const start = Date.now();
    try {
        const query = homepageAudit_1.getAuditLogsSchema.parse(req.query);
        const filter = {};
        if (query.action)
            filter.action = query.action;
        if (query.sectionId)
            filter.sectionId = query.sectionId;
        if (query.actorId)
            filter.actorId = query.actorId;
        const skip = (query.page - 1) * query.limit;
        const [items, total] = await Promise.all([
            HomepageAuditLog_1.HomepageAuditLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(query.limit)
                .lean(),
            HomepageAuditLog_1.HomepageAuditLog.countDocuments(filter),
        ]);
        logger_1.logger.info("Fetched homepage audit logs", { reqId: req.id, filter, duration: Date.now() - start });
        res.status(200).json({
            success: true,
            data: {
                items,
                pagination: {
                    page: query.page,
                    limit: query.limit,
                    total,
                    pages: Math.ceil(total / query.limit),
                },
            },
        });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
        }
        logger_1.logger.error("Error fetching homepage audit logs", { reqId: req.id, error: error.message });
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getHomepageAuditLogs = getHomepageAuditLogs;
