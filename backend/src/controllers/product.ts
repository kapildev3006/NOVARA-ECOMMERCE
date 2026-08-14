import { Request, Response } from "express";
import { Product } from "../models/Product";
import { Category } from "../models/Category";
import { createProductSchema, updateProductSchema, updateStockSchema } from "../validators/product";
import { productQuerySchema } from "../validators/query";
import { getPaginationData } from "../utils/pagination";
import { emitToAdmins, emitToSuperAdmins } from "../realtime/socket";
import mongoose from "mongoose";

// --- HELPERS ---

const evaluateStockEvents = (productId: string, productName: string, stock: number) => {
  if (stock === 0) {
    emitToAdmins("out_of_stock", { productId, productName });
    emitToSuperAdmins("out_of_stock", { productId, productName });
  } else if (stock > 0 && stock <= 10) {
    emitToAdmins("low_stock", { productId, productName, stock });
    emitToSuperAdmins("low_stock", { productId, productName, stock });
  }
};

// --- PUBLIC ---

export const getPublicProducts = async (req: Request, res: Response) => {
  try {
    const query = productQuerySchema.parse(req.query);
    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } }
      ];
    }

    if (query.category) {
      if (mongoose.Types.ObjectId.isValid(query.category)) {
        filter.category = query.category;
      } else {
        const cat = await Category.findOne({ slug: query.category }).select("_id").lean();
        if (cat) filter.category = cat._id;
        else filter.category = null; // category slug not found => no products
      }
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
    }

    let sortOption: any = { createdAt: -1 }; // newest default
    switch (query.sort) {
      case "price_asc": sortOption = { price: 1 }; break;
      case "price_desc": sortOption = { price: -1 }; break;
      case "rating": sortOption = { ratings: -1 }; break;
      case "stock": sortOption = { stock: -1 }; break;
      case "best_seller": sortOption = { isBestSeller: -1, createdAt: -1 }; break;
    }

    const total = await Product.countDocuments(filter);
    const { skip, limit, pagination } = getPaginationData(query.page, query.limit, total);

    const items = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug")
      .lean();

    res.status(200).json({ success: true, data: { items, pagination } });
  } catch (error) {
    res.status(400).json({ success: false, error: { message: "Invalid query parameters" } });
  }
};

export const getPublicProductBySlug = async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate("category", "name slug").lean();
    if (!product) {
      return res.status(404).json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

// --- ADMIN ---

export const createAdminProduct = async (req: Request, res: Response) => {
  try {
    const data = createProductSchema.parse(req.body);

    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) {
      return res.status(422).json({ success: false, error: { code: "CATEGORY_NOT_FOUND", message: "Invalid category ID" } });
    }

    const slugExists = await Product.findOne({ slug: data.slug });
    if (slugExists) {
      return res.status(409).json({ success: false, error: { code: "SLUG_ALREADY_EXISTS", message: "A product with this slug already exists" } });
    }

    const product = await Product.create(data);

    const payload = { productId: product._id.toString(), name: product.name, slug: product.slug, categoryId: product.category.toString() };
    emitToAdmins("product_created", payload);
    emitToSuperAdmins("product_created", payload);
    evaluateStockEvents(product._id.toString(), product.name, product.stock);

    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    console.error("CREATE ERROR:", error);
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const updateAdminProduct = async (req: Request, res: Response) => {
  try {
    const data = updateProductSchema.parse(req.body);

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } });
    }

    if (data.category && data.category !== product.category.toString()) {
      const categoryExists = await Category.findById(data.category);
      if (!categoryExists) {
        return res.status(422).json({ success: false, error: { code: "CATEGORY_NOT_FOUND", message: "Invalid category ID" } });
      }
    }

    if (data.slug && data.slug !== product.slug) {
      const slugExists = await Product.findOne({ slug: data.slug });
      if (slugExists) {
        return res.status(409).json({ success: false, error: { code: "SLUG_ALREADY_EXISTS", message: "A product with this slug already exists" } });
      }
    }

    Object.assign(product, data);
    await product.save();

    const payload = { productId: product._id.toString(), name: product.name, slug: product.slug, categoryId: product.category.toString() };
    emitToAdmins("product_updated", payload);
    emitToSuperAdmins("product_updated", payload);
    if (data.stock !== undefined) {
      evaluateStockEvents(product._id.toString(), product.name, product.stock);
    }

    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, error: { message: "Invalid ID format" } });
    }
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const updateAdminProductStock = async (req: Request, res: Response) => {
  try {
    const { stock } = updateStockSchema.parse(req.body);

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } });
    }

    product.stock = stock;
    await product.save();

    const payload = { productId: product._id.toString(), name: product.name, slug: product.slug, categoryId: product.category.toString() };
    emitToAdmins("product_updated", payload);
    emitToSuperAdmins("product_updated", payload);
    evaluateStockEvents(product._id.toString(), product.name, product.stock);

    res.status(200).json({ success: true, data: { stock: product.stock } });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(422).json({ success: false, error: { message: "Validation error", details: error.issues } });
    }
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};

export const deleteAdminProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } });
    }

    await product.deleteOne();

    emitToAdmins("product_deleted", { productId: product._id.toString() });
    emitToSuperAdmins("product_deleted", { productId: product._id.toString() });

    res.status(200).json({ success: true, data: { message: "Product deleted" } });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: "Internal server error" } });
  }
};
