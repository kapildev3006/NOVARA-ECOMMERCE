"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_1 = require("../controllers/category");
const router = (0, express_1.Router)();
router.get("/", category_1.getPublicCategories);
router.get("/:slug", category_1.getPublicCategoryBySlug);
exports.default = router;
