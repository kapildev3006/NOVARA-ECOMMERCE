import { Router } from "express";
import { getPublicProducts, getPublicProductBySlug } from "../controllers/product";

const router = Router();

router.get("/", getPublicProducts);
router.get("/:slug", getPublicProductBySlug);

export default router;
