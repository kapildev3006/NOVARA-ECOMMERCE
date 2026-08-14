import { Router } from "express";
import {
  getAdminHomepage,
  createAdminHomepageSection,
  updateAdminHomepageSection,
  deleteAdminHomepageSection,
  reorderAdminHomepageSections,
  publishAdminHomepage,
  getAdminHomepagePreview
} from "../controllers/homepage";
import { getHomepageAuditLogs } from "../controllers/homepageAudit";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("Admin", "SuperAdmin"));

// CMS Operations
router.get("/", getAdminHomepage);
router.post("/", createAdminHomepageSection);
router.put("/", reorderAdminHomepageSections);
router.patch("/:id", updateAdminHomepageSection);
router.delete("/:id", deleteAdminHomepageSection);

// Draft & Publish
router.get("/preview", getAdminHomepagePreview);
router.post("/publish", publishAdminHomepage);

// Audit
router.get("/audit", getHomepageAuditLogs);

export default router;
