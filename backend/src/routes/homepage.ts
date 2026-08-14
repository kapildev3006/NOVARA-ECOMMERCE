import { Router } from "express";
import { getPublicHomepage } from "../controllers/homepage";

const router = Router();

router.get("/", getPublicHomepage);

export default router;
