"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const homepage_1 = require("../controllers/homepage");
const homepageCampaign_1 = require("../controllers/homepageCampaign");
const homepageAudit_1 = require("../controllers/homepageAudit");
const auth_1 = require("../middleware/auth");
const homepageCampaign_2 = require("../validators/homepageCampaign");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, auth_1.requireRole)("Admin", "SuperAdmin"));
// CMS Operations
router.get("/", (0, auth_1.requirePermission)("homepage.view"), homepage_1.getAdminHomepage);
router.post("/", (0, auth_1.requirePermission)("homepage.edit"), homepage_1.createAdminHomepageSection);
router.put("/", (0, auth_1.requirePermission)("homepage.edit"), homepage_1.reorderAdminHomepageSections);
router.patch("/:id", (0, auth_1.requirePermission)("homepage.edit"), homepage_1.updateAdminHomepageSection);
router.delete("/:id", (0, auth_1.requirePermission)("homepage.edit"), homepage_1.deleteAdminHomepageSection);
router.post("/validate", (0, auth_1.requirePermission)("homepage.edit"), homepage_1.validateAdminHomepage);
// Campaign Routes
router.get("/campaigns", (0, auth_1.requirePermission)("homepage.campaigns.manage"), homepageCampaign_1.getAdminHomepageCampaigns);
router.get("/campaigns/:campaignKey", (0, auth_1.requirePermission)("homepage.campaigns.manage"), homepageCampaign_1.getAdminHomepageCampaignDetail);
router.post("/campaigns", (0, auth_1.requirePermission)("homepage.campaigns.manage"), homepageCampaign_2.validateHomepageCampaign, homepageCampaign_1.createAdminHomepageCampaign);
router.post("/campaigns/:campaignKey/cancel", (0, auth_1.requirePermission)("homepage.campaigns.manage"), homepageCampaign_1.cancelAdminHomepageCampaign);
// Draft & Publish
router.get("/preview", (0, auth_1.requirePermission)("homepage.preview"), homepage_1.getAdminHomepagePreview);
router.post("/publish", (0, auth_1.requirePermission)("homepage.publish"), homepage_1.publishAdminHomepage);
router.post("/schedule", (0, auth_1.requirePermission)("homepage.schedule"), homepage_1.scheduleAdminHomepage);
router.delete("/schedule", (0, auth_1.requirePermission)("homepage.schedule"), homepage_1.cancelAdminHomepageSchedule);
// Revisions
router.get("/revisions", (0, auth_1.requirePermission)("homepage.revisions.view"), homepage_1.getAdminHomepageRevisions);
router.get("/revisions/:revisionId", (0, auth_1.requirePermission)("homepage.revisions.view"), homepage_1.getAdminHomepageRevisionDetail);
router.get("/revisions/:revisionId/preview", (0, auth_1.requirePermission)("homepage.preview"), homepage_1.getAdminHomepageRevisionPreview);
router.post("/revisions/:revisionId/rollback", (0, auth_1.requirePermission)("homepage.rollback"), homepage_1.rollbackHomepageRevision);
// Audit
router.get("/audit", (0, auth_1.requirePermission)("homepage.audit.view"), homepageAudit_1.getHomepageAuditLogs);
exports.default = router;
