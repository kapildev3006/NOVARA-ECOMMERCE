import { Router } from "express";
import { createAdminCategory, updateAdminCategory, deleteAdminCategory } from "../controllers/category";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("Admin", "SuperAdmin"));

router.post("/", createAdminCategory);
router.patch("/:id", updateAdminCategory);
router.delete("/:id", deleteAdminCategory);

export default router;
