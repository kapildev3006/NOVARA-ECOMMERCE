"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminUsers_controller_1 = require("../controllers/adminUsers.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Only SuperAdmin can manage permissions
router.use(auth_1.authenticate, (0, auth_1.requireRole)("SuperAdmin"));
router.get("/:userId/homepage-permissions", adminUsers_controller_1.getUserHomepagePermissions);
router.put("/:userId/homepage-permissions", adminUsers_controller_1.updateUserHomepagePermissions);
exports.default = router;
