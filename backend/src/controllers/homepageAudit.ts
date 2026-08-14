import { Request, Response } from "express";
import { HomepageAuditLog } from "../models/HomepageAuditLog";
import { getAuditLogsSchema } from "../validators/homepageAudit";
import { logger } from "../utils/logger";

export const getHomepageAuditLogs = async (req: Request, res: Response) => {
  const start = Date.now();
  try {
    const query = getAuditLogsSchema.parse(req.query);

    const filter: any = {};
    if (query.action) filter.action = query.action;
    if (query.sectionId) filter.sectionId = query.sectionId;
    if (query.actorId) filter.actorId = query.actorId;

    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      HomepageAuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      HomepageAuditLog.countDocuments(filter),
    ]);

    logger.info("Fetched homepage audit logs", { reqId: req.id, filter, duration: Date.now() - start });

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
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    logger.error("Error fetching homepage audit logs", { reqId: req.id, error: error.message });
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};
