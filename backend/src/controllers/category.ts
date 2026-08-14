import { Request, Response } from "express";
import { Category } from "../models/Category";
import { Product } from "../models/Product";
import { createCategorySchema, updateCategorySchema } from "../validators/category";
import { categoryQuerySchema } from "../validators/query";
import { getPaginationData } from "../utils/pagination";
import { emitToAdmins, emitToSuperAdmins } from "../realtime/socket";

// --- PUBLIC ---

export const getPublicCategories = async (req: Request, res: Response) => {
  try {
    const query = categoryQuerySchema.parse(req.query);
    const filter: any = { isActive: true };

    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
    }

    const sortOption: any = query.sort === "name_desc" ? { name: -1 } : { name: 1 };

    const total = await Category.countDocuments(filter);
    const { skip, limit, pagination } = getPaginationData(query.page, query.limit, total);

    const items = await Category.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({ success: true, data: { items, pagination } });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: "Invalid query parameters" } });
  }
};

export const getPublicCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!category) {
      return res.status(404).json({ success: false, error: { code: "CATEGORY_NOT_FOUND", message: "Category not found" } });
    }
    const productCount = await Product.countDocuments({ category: category._id });
    res.status(200).json({ success: true, data: { ...category, productCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

// --- ADMIN ---

export const createAdminCategory = async (req: Request, res: Response) => {
  try {
    const data = createCategorySchema.parse(req.body);

    const existing = await Category.findOne({ slug: data.slug });
    if (existing) {
      return res.status(409).json({ success: false, error: { code: "SLUG_ALREADY_EXISTS", message: "Category slug already exists" } });
    }

    const category = await Category.create(data);

    emitToAdmins("category_created", { categoryId: category._id.toString(), name: category.name });
    emitToSuperAdmins("category_created", { categoryId: category._id.toString(), name: category.name });

    res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const updateAdminCategory = async (req: Request, res: Response) => {
  try {
    const data = updateCategorySchema.parse(req.body);

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: { code: "CATEGORY_NOT_FOUND", message: "Category not found" } });
    }

    if (data.slug && data.slug !== category.slug) {
      const existing = await Category.findOne({ slug: data.slug });
      if (existing) {
        return res.status(409).json({ success: false, error: { code: "SLUG_ALREADY_EXISTS", message: "Category slug already exists" } });
      }
    }

    Object.assign(category, data);
    await category.save();

    emitToAdmins("category_updated", { categoryId: category._id.toString(), name: category.name });
    emitToSuperAdmins("category_updated", { categoryId: category._id.toString(), name: category.name });

    res.status(200).json({ success: true, data: category });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const deleteAdminCategory = async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, error: { code: "CATEGORY_NOT_FOUND", message: "Category not found" } });
    }

    const productCount = await Product.countDocuments({ category: category._id });
    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        error: { code: "CATEGORY_IN_USE", message: "Category contains products and cannot be deleted" }
      });
    }

    await category.deleteOne();

    emitToAdmins("category_deleted", { categoryId: category._id.toString() });
    emitToSuperAdmins("category_deleted", { categoryId: category._id.toString() });

    res.status(200).json({ success: true, data: { message: "Category deleted" } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};
