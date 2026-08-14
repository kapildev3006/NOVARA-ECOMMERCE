"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdminProduct = exports.updateAdminProductStock = exports.updateAdminProduct = exports.createAdminProduct = exports.getPublicProductBySlug = exports.getPublicProducts = void 0;
const Product_1 = require("../models/Product");
const Category_1 = require("../models/Category");
const product_1 = require("../validators/product");
const query_1 = require("../validators/query");
const pagination_1 = require("../utils/pagination");
const socket_1 = require("../realtime/socket");
const mongoose_1 = __importDefault(require("mongoose"));
// --- HELPERS ---
const evaluateStockEvents = (productId, productName, stock) => {
    if (stock === 0) {
        (0, socket_1.emitToAdmins)("out_of_stock", { productId, productName });
        (0, socket_1.emitToSuperAdmins)("out_of_stock", { productId, productName });
    }
    else if (stock > 0 && stock <= 10) {
        (0, socket_1.emitToAdmins)("low_stock", { productId, productName, stock });
        (0, socket_1.emitToSuperAdmins)("low_stock", { productId, productName, stock });
    }
};
// --- PUBLIC ---
const getPublicProducts = async (req, res) => {
    try {
        const query = query_1.productQuerySchema.parse(req.query);
        const filter = {};
        if (query.search) {
            filter.$or = [
                { name: { $regex: query.search, $options: "i" } },
                { description: { $regex: query.search, $options: "i" } }
            ];
        }
        if (query.category) {
            if (mongoose_1.default.Types.ObjectId.isValid(query.category)) {
                filter.category = query.category;
            }
            else {
                const cat = await Category_1.Category.findOne({ slug: query.category }).select("_id").lean();
                if (cat)
                    filter.category = cat._id;
                else
                    filter.category = null; // category slug not found => no products
            }
        }
        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            filter.price = {};
            if (query.minPrice !== undefined)
                filter.price.$gte = query.minPrice;
            if (query.maxPrice !== undefined)
                filter.price.$lte = query.maxPrice;
        }
        let sortOption = { createdAt: -1 }; // newest default
        switch (query.sort) {
            case "price_asc":
                sortOption = { price: 1 };
                break;
            case "price_desc":
                sortOption = { price: -1 };
                break;
            case "rating":
                sortOption = { ratings: -1 };
                break;
            case "stock":
                sortOption = { stock: -1 };
                break;
            case "best_seller":
                sortOption = { isBestSeller: -1, createdAt: -1 };
                break;
        }
        const total = await Product_1.Product.countDocuments(filter);
        const { skip, limit, pagination } = (0, pagination_1.getPaginationData)(query.page, query.limit, total);
        const items = await Product_1.Product.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .populate("category", "name slug")
            .lean();
        res.status(200).json({ success: true, data: { items, pagination } });
    }
    catch (error) {
        res.status(400).json({ success: false, error: { message: "Invalid query parameters" } });
    }
};
exports.getPublicProducts = getPublicProducts;
const getPublicProductBySlug = async (req, res) => {
    try {
        const product = await Product_1.Product.findOne({ slug: req.params.slug }).populate("category", "name slug").lean();
        if (!product) {
            return res.status(404).json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } });
        }
        res.status(200).json({ success: true, data: product });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.getPublicProductBySlug = getPublicProductBySlug;
// --- ADMIN ---
const createAdminProduct = async (req, res) => {
    try {
        const data = product_1.createProductSchema.parse(req.body);
        const categoryExists = await Category_1.Category.findById(data.category);
        if (!categoryExists) {
            return res.status(422).json({ success: false, error: { code: "CATEGORY_NOT_FOUND", message: "Invalid category ID" } });
        }
        const slugExists = await Product_1.Product.findOne({ slug: data.slug });
        if (slugExists) {
            return res.status(409).json({ success: false, error: { code: "SLUG_ALREADY_EXISTS", message: "A product with this slug already exists" } });
        }
        const product = await Product_1.Product.create(data);
        const payload = { productId: product._id.toString(), name: product.name, slug: product.slug, categoryId: product.category.toString() };
        (0, socket_1.emitToAdmins)("product_created", payload);
        (0, socket_1.emitToSuperAdmins)("product_created", payload);
        evaluateStockEvents(product._id.toString(), product.name, product.stock);
        res.status(201).json({ success: true, data: product });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
        }
        console.error("CREATE ERROR:", error);
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.createAdminProduct = createAdminProduct;
const updateAdminProduct = async (req, res) => {
    try {
        const data = product_1.updateProductSchema.parse(req.body);
        const product = await Product_1.Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } });
        }
        if (data.category && data.category !== product.category.toString()) {
            const categoryExists = await Category_1.Category.findById(data.category);
            if (!categoryExists) {
                return res.status(422).json({ success: false, error: { code: "CATEGORY_NOT_FOUND", message: "Invalid category ID" } });
            }
        }
        if (data.slug && data.slug !== product.slug) {
            const slugExists = await Product_1.Product.findOne({ slug: data.slug });
            if (slugExists) {
                return res.status(409).json({ success: false, error: { code: "SLUG_ALREADY_EXISTS", message: "A product with this slug already exists" } });
            }
        }
        Object.assign(product, data);
        await product.save();
        const payload = { productId: product._id.toString(), name: product.name, slug: product.slug, categoryId: product.category.toString() };
        (0, socket_1.emitToAdmins)("product_updated", payload);
        (0, socket_1.emitToSuperAdmins)("product_updated", payload);
        if (data.stock !== undefined) {
            evaluateStockEvents(product._id.toString(), product.name, product.stock);
        }
        res.status(200).json({ success: true, data: product });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
        }
        if (error.name === "CastError") {
            return res.status(400).json({ success: false, error: { message: "Invalid ID format" } });
        }
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.updateAdminProduct = updateAdminProduct;
const updateAdminProductStock = async (req, res) => {
    try {
        const { stock } = product_1.updateStockSchema.parse(req.body);
        const product = await Product_1.Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } });
        }
        product.stock = stock;
        await product.save();
        const payload = { productId: product._id.toString(), name: product.name, slug: product.slug, categoryId: product.category.toString() };
        (0, socket_1.emitToAdmins)("product_updated", payload);
        (0, socket_1.emitToSuperAdmins)("product_updated", payload);
        evaluateStockEvents(product._id.toString(), product.name, product.stock);
        res.status(200).json({ success: true, data: { stock: product.stock } });
    }
    catch (error) {
        if (error.name === "ZodError") {
            return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
        }
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.updateAdminProductStock = updateAdminProductStock;
const deleteAdminProduct = async (req, res) => {
    try {
        const product = await Product_1.Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } });
        }
        await product.deleteOne();
        (0, socket_1.emitToAdmins)("product_deleted", { productId: product._id.toString() });
        (0, socket_1.emitToSuperAdmins)("product_deleted", { productId: product._id.toString() });
        res.status(200).json({ success: true, data: { message: "Product deleted" } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: { message: "Internal server error" } });
    }
};
exports.deleteAdminProduct = deleteAdminProduct;
