import { Router } from "express";
import { getUserHomepagePermissions, updateUserHomepagePermissions } from "../controllers/adminUsers.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// Only SuperAdmin can manage permissions
router.use(authenticate, requireRole("SuperAdmin"));

router.get("/:userId/homepage-permissions", getUserHomepagePermissions);
router.put("/:userId/homepage-permissions", updateUserHomepagePermissions);

export default router;
