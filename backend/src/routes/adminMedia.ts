import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requirePermission } from "../middleware/auth";
import {
  uploadMedia,
  listMedia,
  getMediaDetail,
  updateMediaMetadata,
  deleteMedia,
  getMediaUsage,
  uploadMiddleware,
} from "../controllers/media.controller";

const router = Router();

router.use(authenticate);

// View media uses homepage.view permission
router.get("/", requirePermission("homepage.view"), listMedia);
router.get("/:assetKey", requirePermission("homepage.view"), getMediaDetail);
router.get("/:assetKey/usage", requirePermission("homepage.view"), getMediaUsage);

// Write operations use homepage.edit permission
router.post("/", requirePermission("homepage.edit"), uploadMiddleware, uploadMedia);
router.put("/:assetKey", requirePermission("homepage.edit"), updateMediaMetadata);
router.delete("/:assetKey", requirePermission("homepage.edit"), deleteMedia);

export default router;
