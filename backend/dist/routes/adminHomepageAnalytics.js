"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const homepageAnalytics_1 = require("../controllers/homepageAnalytics");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use((0, auth_1.requireRole)("Admin", "SuperAdmin"));
// All routes require homepage.analytics.view permission
router.use((0, auth_1.requirePermission)("homepage.analytics.view"));
router.get("/", homepageAnalytics_1.getHomepageAnalytics);
exports.default = router;
