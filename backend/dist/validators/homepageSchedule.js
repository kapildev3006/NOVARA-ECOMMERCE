"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schedulePublishSchema = void 0;
const zod_1 = require("zod");
exports.schedulePublishSchema = zod_1.z.object({
    revisionId: zod_1.z.number().int().positive(),
    publishAt: zod_1.z.string().refine((val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date.getTime() > Date.now();
    }, { message: "publishAt must be a valid ISO string in the future" }),
});
