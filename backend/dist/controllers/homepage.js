"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderAdminHomepageSections = exports.deleteAdminHomepageSection = exports.updateAdminHomepageSection = exports.createAdminHomepageSection = exports.getAdminHomepage = exports.getPublicHomepage = void 0;
const HomepageSection_1 = require("../models/HomepageSection");
const homepage_1 = require("../validators/homepage");
const socket_1 = require("../realtime/socket");
// --- HELPERS ---
const triggerUpdateEvent = () => {
    (0, socket_1.emitToAll)("homepage_updated", { version: Date.now().toString() });
};
// --- PUBLIC ---
const getPublicHomepage = async (req, res) => {
    try {
        const sections = await HomepageSection_1.HomepageSection.find({ enabled: true })
            .sort({ order: 1 })
            .select("-__v -createdAt -updatedAt")
            .lean();
        res.status(200).json({ success: true, data: sections });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getPublicHomepage = getPublicHomepage;
// --- ADMIN ---
const getAdminHomepage = async (req, res) => {
    try {
        const sections = await HomepageSection_1.HomepageSection.find()
            .sort({ order: 1 })
            .select("-__v")
            .lean();
        res.status(200).json({ success: true, data: sections });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getAdminHomepage = getAdminHomepage;
const createAdminHomepageSection = async (req, res) => {
    try {
        const data = homepage_1.createSectionSchema.parse(req.body);
        const existing = await HomepageSection_1.HomepageSection.findOne({ sectionKey: data.sectionKey });
        if (existing) {
            return res.status(409).json({ success: false, error: { code: "SECTION_ALREADY_EXISTS", message: "A section with this key already exists" } });
        }
        // New custom sections are not protected by default
        const section = await HomepageSection_1.HomepageSection.create({ ...data, isProtected: false });
        triggerUpdateEvent();
        res.status(201).json({ success: true, data: section });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
        }
        console.error(error);
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.createAdminHomepageSection = createAdminHomepageSection;
const updateAdminHomepageSection = async (req, res) => {
    try {
        const data = homepage_1.updateSectionSchema.parse(req.body);
        const section = await HomepageSection_1.HomepageSection.findById(req.params.id);
        if (!section) {
            return res.status(404).json({ success: false, error: { code: "SECTION_NOT_FOUND", message: "Homepage section not found" } });
        }
        Object.assign(section, data);
        await section.save();
        triggerUpdateEvent();
        res.status(200).json({ success: true, data: section });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
        }
        if (error.name === "CastError") {
            return res.status(400).json({ success: false, error: { message: "Invalid ID format" } });
        }
        console.error(error);
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.updateAdminHomepageSection = updateAdminHomepageSection;
const deleteAdminHomepageSection = async (req, res) => {
    try {
        const section = await HomepageSection_1.HomepageSection.findById(req.params.id);
        if (!section) {
            return res.status(404).json({ success: false, error: { code: "SECTION_NOT_FOUND", message: "Homepage section not found" } });
        }
        if (section.isProtected) {
            return res.status(409).json({ success: false, error: { code: "SECTION_PROTECTED", message: "Protected sections cannot be deleted" } });
        }
        await section.deleteOne();
        triggerUpdateEvent();
        res.status(200).json({ success: true, data: { message: "Section deleted" } });
    }
    catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ success: false, error: { message: "Invalid ID format" } });
        }
        console.error(error);
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.deleteAdminHomepageSection = deleteAdminHomepageSection;
const reorderAdminHomepageSections = async (req, res) => {
    try {
        const data = homepage_1.reorderSectionsSchema.parse(req.body);
        const bulkOps = data.sections.map((sec) => ({
            updateOne: {
                filter: { _id: sec.id },
                update: { $set: { order: sec.order } },
            },
        }));
        if (bulkOps.length > 0) {
            await HomepageSection_1.HomepageSection.bulkWrite(bulkOps);
            triggerUpdateEvent();
        }
        res.status(200).json({ success: true, data: { message: "Sections reordered successfully" } });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
        }
        console.error(error);
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.reorderAdminHomepageSections = reorderAdminHomepageSections;
