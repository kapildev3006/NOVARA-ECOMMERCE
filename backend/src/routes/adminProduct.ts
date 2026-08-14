import { Router } from "express";
import { createAdminProduct, updateAdminProduct, deleteAdminProduct, updateAdminProductStock } from "../controllers/product";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("Admin", "SuperAdmin"));

router.post("/", createAdminProduct);
router.patch("/:id", updateAdminProduct);
router.delete("/:id", deleteAdminProduct);
router.patch("/:id/stock", updateAdminProductStock);

export default router;
