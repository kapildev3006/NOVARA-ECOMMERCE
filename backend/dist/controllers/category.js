"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdminCategory = exports.updateAdminCategory = exports.createAdminCategory = exports.getPublicCategoryBySlug = exports.getPublicCategories = void 0;
const Category_1 = require("../models/Category");
const Product_1 = require("../models/Product");
const category_1 = require("../validators/category");
const query_1 = require("../validators/query");
const pagination_1 = require("../utils/pagination");
const socket_1 = require("../realtime/socket");
// --- PUBLIC ---
const getPublicCategories = async (req, res) => {
    try {
        const query = query_1.categoryQuerySchema.parse(req.query);
        const filter = { isActive: true };
        if (query.search) {
            filter.name = { $regex: query.search, $options: "i" };
        }
        const sortOption = query.sort === "name_desc" ? { name: -1 } : { name: 1 };
        const total = await Category_1.Category.countDocuments(filter);
        const { skip, limit, pagination } = (0, pagination_1.getPaginationData)(query.page, query.limit, total);
        const items = await Category_1.Category.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .lean();
        res.status(200).json({ success: true, data: { items, pagination } });
    }
    catch (error) {
        res.status(400).json({ success: false, error: { message: "Invalid query parameters" } });
    }
};
exports.getPublicCategories = getPublicCategories;
const getPublicCategoryBySlug = async (req, res) => {
    try {
        const category = await Category_1.Category.findOne({ slug: req.params.slug, isActive: true }).lean();
        if (!category) {
            return res.status(404).json({ success: false, error: { code: "CATEGORY_NOT_FOUND", message: "Category not found" } });
        }
        const productCount = await Product_1.Product.countDocuments({ category: category._id });
        res.status(200).json({ success: true, data: { ...category, productCount } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getPublicCategoryBySlug = getPublicCategoryBySlug;
// --- ADMIN ---
const createAdminCategory = async (req, res) => {
    try {
        const data = category_1.createCategorySchema.parse(req.body);
        const existing = await Category_1.Category.findOne({ slug: data.slug });
        if (existing) {
            return res.status(409).json({ success: false, error: { code: "SLUG_ALREADY_EXISTS", message: "Category slug already exists" } });
        }
        const category = await Category_1.Category.create(data);
        (0, socket_1.emitToAdmins)("category_created", { categoryId: category._id.toString(), name: category.name });
        (0, socket_1.emitToSuperAdmins)("category_created", { categoryId: category._id.toString(), name: category.name });
        res.status(201).json({ success: true, data: category });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
        }
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.createAdminCategory = createAdminCategory;
const updateAdminCategory = async (req, res) => {
    try {
        const data = category_1.updateCategorySchema.parse(req.body);
        const category = await Category_1.Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, error: { code: "CATEGORY_NOT_FOUND", message: "Category not found" } });
        }
        if (data.slug && data.slug !== category.slug) {
            const existing = await Category_1.Category.findOne({ slug: data.slug });
            if (existing) {
                return res.status(409).json({ success: false, error: { code: "SLUG_ALREADY_EXISTS", message: "Category slug already exists" } });
            }
        }
        Object.assign(category, data);
        await category.save();
        (0, socket_1.emitToAdmins)("category_updated", { categoryId: category._id.toString(), name: category.name });
        (0, socket_1.emitToSuperAdmins)("category_updated", { categoryId: category._id.toString(), name: category.name });
        res.status(200).json({ success: true, data: category });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
        }
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.updateAdminCategory = updateAdminCategory;
const deleteAdminCategory = async (req, res) => {
    try {
        const category = await Category_1.Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, error: { code: "CATEGORY_NOT_FOUND", message: "Category not found" } });
        }
        const productCount = await Product_1.Product.countDocuments({ category: category._id });
        if (productCount > 0) {
            return res.status(409).json({
                success: false,
                error: { code: "CATEGORY_IN_USE", message: "Category contains products and cannot be deleted" }
            });
        }
        await category.deleteOne();
        (0, socket_1.emitToAdmins)("category_deleted", { categoryId: category._id.toString() });
        (0, socket_1.emitToSuperAdmins)("category_deleted", { categoryId: category._id.toString() });
        res.status(200).json({ success: true, data: { message: "Category deleted" } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.deleteAdminCategory = deleteAdminCategory;
