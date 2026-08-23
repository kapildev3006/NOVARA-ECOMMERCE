import { Router } from "express";
import { authenticate, requireRole, requirePermission } from "../middleware/auth";
import { getHomepageAnalytics } from "../controllers/homepageAnalytics";

const router = Router();

router.use(authenticate);
router.use(requireRole("Admin", "SuperAdmin"));

// All routes require homepage.analytics.view permission
router.use(requirePermission("homepage.analytics.view"));

router.get("/", getHomepageAnalytics);

export default router;
