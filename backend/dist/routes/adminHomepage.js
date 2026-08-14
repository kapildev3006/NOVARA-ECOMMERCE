"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const homepage_1 = require("../controllers/homepage");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.requireRole)("Admin", "SuperAdmin"));
router.get("/", homepage_1.getAdminHomepage);
router.post("/", homepage_1.createAdminHomepageSection);
router.put("/", homepage_1.reorderAdminHomepageSections); // Bulk reorder
router.patch("/:id", homepage_1.updateAdminHomepageSection); // Changed from PUT to PATCH in plan, prompt says PATCH or PUT, let's look at prompt: PATCH /api/v1/admin/homepage/sections/:id wait, the prompt asks for routes:
// GET /api/v1/admin/homepage
// POST /api/v1/admin/homepage
// PUT /api/v1/admin/homepage/:id
// DELETE /api/v1/admin/homepage/:id
// PUT /api/v1/admin/homepage
// Let's stick to the prompt exactly for the route paths:
router.put("/:id", homepage_1.updateAdminHomepageSection);
router.delete("/:id", homepage_1.deleteAdminHomepageSection);
exports.default = router;
