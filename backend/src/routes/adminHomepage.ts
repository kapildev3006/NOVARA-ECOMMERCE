import { Router } from "express";
import {
  getAdminHomepage,
  createAdminHomepageSection,
  updateAdminHomepageSection,
  deleteAdminHomepageSection,
  reorderAdminHomepageSections,
  publishAdminHomepage,
  getAdminHomepagePreview,
  getAdminHomepageRevisions,
  getAdminHomepageRevisionDetail,
  rollbackHomepageRevision,
  getAdminHomepageRevisionPreview,
  scheduleAdminHomepage,
  cancelAdminHomepageSchedule,
  validateAdminHomepage
} from "../controllers/homepage";
import {
  getAdminHomepageCampaigns,
  getAdminHomepageCampaignDetail,
  createAdminHomepageCampaign,
  cancelAdminHomepageCampaign
} from "../controllers/homepageCampaign";
import { getHomepageAuditLogs } from "../controllers/homepageAudit";
import { authenticate, requireRole, requirePermission } from "../middleware/auth";
import { validateHomepageCampaign } from "../validators/homepageCampaign";

const router = Router();

router.use(authenticate, requireRole("Admin", "SuperAdmin"));

// CMS Operations
router.get("/", requirePermission("homepage.view"), getAdminHomepage);
router.post("/", requirePermission("homepage.edit"), createAdminHomepageSection);
router.put("/", requirePermission("homepage.edit"), reorderAdminHomepageSections);
router.patch("/:id", requirePermission("homepage.edit"), updateAdminHomepageSection);
router.delete("/:id", requirePermission("homepage.edit"), deleteAdminHomepageSection);
router.post("/validate", requirePermission("homepage.edit"), validateAdminHomepage);

// Campaign Routes
router.get("/campaigns", requirePermission("homepage.campaigns.manage"), getAdminHomepageCampaigns);
router.get("/campaigns/:campaignKey", requirePermission("homepage.campaigns.manage"), getAdminHomepageCampaignDetail);
router.post("/campaigns", requirePermission("homepage.campaigns.manage"), validateHomepageCampaign, createAdminHomepageCampaign);
router.post("/campaigns/:campaignKey/cancel", requirePermission("homepage.campaigns.manage"), cancelAdminHomepageCampaign);

// Draft & Publish
router.get("/preview", requirePermission("homepage.preview"), getAdminHomepagePreview);
router.post("/publish", requirePermission("homepage.publish"), publishAdminHomepage);
router.post("/schedule", requirePermission("homepage.schedule"), scheduleAdminHomepage);
router.delete("/schedule", requirePermission("homepage.schedule"), cancelAdminHomepageSchedule);

// Revisions
router.get("/revisions", requirePermission("homepage.revisions.view"), getAdminHomepageRevisions);
router.get("/revisions/:revisionId", requirePermission("homepage.revisions.view"), getAdminHomepageRevisionDetail);
router.get("/revisions/:revisionId/preview", requirePermission("homepage.preview"), getAdminHomepageRevisionPreview);
router.post("/revisions/:revisionId/rollback", requirePermission("homepage.rollback"), rollbackHomepageRevision);

// Audit
router.get("/audit", requirePermission("homepage.audit.view"), getHomepageAuditLogs);

export default router;
