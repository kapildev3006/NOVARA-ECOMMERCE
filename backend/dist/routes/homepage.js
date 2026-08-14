"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const homepage_1 = require("../controllers/homepage");
const router = (0, express_1.Router)();
router.get("/", homepage_1.getPublicHomepage);
exports.default = router;
