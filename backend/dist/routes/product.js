"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_1 = require("../controllers/product");
const router = (0, express_1.Router)();
router.get("/", product_1.getPublicProducts);
router.get("/:slug", product_1.getPublicProductBySlug);
exports.default = router;
