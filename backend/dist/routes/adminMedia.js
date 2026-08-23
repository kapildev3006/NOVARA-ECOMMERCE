"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const media_controller_1 = require("../controllers/media.controller");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// View media uses homepage.view permission
router.get("/", (0, auth_2.requirePermission)("homepage.view"), media_controller_1.listMedia);
router.get("/:assetKey", (0, auth_2.requirePermission)("homepage.view"), media_controller_1.getMediaDetail);
router.get("/:assetKey/usage", (0, auth_2.requirePermission)("homepage.view"), media_controller_1.getMediaUsage);
// Write operations use homepage.edit permission
router.post("/", (0, auth_2.requirePermission)("homepage.edit"), media_controller_1.uploadMiddleware, media_controller_1.uploadMedia);
router.put("/:assetKey", (0, auth_2.requirePermission)("homepage.edit"), media_controller_1.updateMediaMetadata);
router.delete("/:assetKey", (0, auth_2.requirePermission)("homepage.edit"), media_controller_1.deleteMedia);
exports.default = router;
