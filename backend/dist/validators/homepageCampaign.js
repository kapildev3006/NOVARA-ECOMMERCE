"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateHomepageCampaign = void 0;
const express_validator_1 = require("express-validator");
exports.validateHomepageCampaign = [
    (0, express_validator_1.body)("campaignKey")
        .isString()
        .trim()
        .notEmpty()
        .matches(/^[a-zA-Z0-9-]+$/)
        .withMessage("campaignKey must be alphanumeric with hyphens only")
        .isLength({ min: 3, max: 64 })
        .withMessage("campaignKey must be between 3 and 64 characters"),
    (0, express_validator_1.body)("name")
        .isString()
        .trim()
        .notEmpty()
        .isLength({ min: 3, max: 100 })
        .withMessage("name must be between 3 and 100 characters"),
    (0, express_validator_1.body)("description")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage("description cannot exceed 500 characters"),
    (0, express_validator_1.body)("revisionId")
        .isInt({ min: 1 })
        .withMessage("revisionId must be a positive integer"),
    (0, express_validator_1.body)("startsAt")
        .optional()
        .isISO8601()
        .withMessage("startsAt must be a valid ISO8601 date")
        .custom((value) => {
        if (new Date(value) < new Date()) {
            throw new Error("startsAt must be in the future");
        }
        return true;
    }),
    (0, express_validator_1.body)("endsAt")
        .optional()
        .isISO8601()
        .withMessage("endsAt must be a valid ISO8601 date")
        .custom((value, { req }) => {
        const { startsAt } = req.body;
        if (startsAt && new Date(value) <= new Date(startsAt)) {
            throw new Error("endsAt must be strictly after startsAt");
        }
        return true;
    }),
    (0, express_validator_1.body)("fallbackRevisionId")
        .optional()
        .isInt({ min: 1 })
        .withMessage("fallbackRevisionId must be a positive integer"),
    // Custom validation rule for endsAt requiring fallbackRevisionId
    (0, express_validator_1.body)().custom((value) => {
        if (value.endsAt && !value.fallbackRevisionId) {
            throw new Error("fallbackRevisionId is required when endsAt is provided");
        }
        return true;
    }),
    (req, res, next) => {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: { message: "Validation failed", details: errors.array() } });
        }
        next();
    },
];
