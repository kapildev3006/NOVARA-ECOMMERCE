import { Router } from "express";
import { getPublicCategories, getPublicCategoryBySlug } from "../controllers/category";

const router = Router();

router.get("/", getPublicCategories);
router.get("/:slug", getPublicCategoryBySlug);

export default router;
