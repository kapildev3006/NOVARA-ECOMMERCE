"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ProductSchema = new mongoose_1.Schema({
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, required: true, min: [0, "Price must be positive"] },
    originalPrice: { type: Number, min: [0, "Original price must be positive"] },
    discount: { type: Number, min: [0, "Discount cannot be negative"], max: [100, "Discount cannot exceed 100"] },
    stock: { type: Number, required: true, min: [0, "Stock cannot be negative"] },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    image: {
        url: { type: String, required: true },
        publicId: { type: String },
        width: { type: Number },
        height: { type: Number },
        format: { type: String },
    },
    gallery: [
        {
            url: { type: String },
            publicId: { type: String },
            width: { type: Number },
            height: { type: Number },
            format: { type: String },
        },
    ],
    // @ts-ignore: isNew is reserved by Mongoose Document, but we must use it as a field
    isNew: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    specifications: { type: Map, of: String },
}, { timestamps: true });
// Indexes
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ stock: 1 });
// Validation hook for originalPrice
ProductSchema.pre("save", function (next) {
    if (this.originalPrice && this.originalPrice < this.price) {
        return next(new Error("Original price must be greater than or equal to current price."));
    }
    next();
});
exports.Product = mongoose_1.default.models.Product || mongoose_1.default.model("Product", ProductSchema);
