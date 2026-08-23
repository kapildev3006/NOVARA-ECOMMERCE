"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogsSchema = void 0;
const zod_1 = require("zod");
exports.getAuditLogsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    action: zod_1.z.enum(["CREATE", "UPDATE", "DELETE", "REORDER", "SEED", "PUBLISH", "ROLLBACK"]).optional(),
    sectionId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Section ID").optional(),
    actorId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Actor ID").optional(),
});
