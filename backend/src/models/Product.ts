import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  slug: string;
  name: string;
  description: string;
  category: mongoose.Types.ObjectId;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  image: {
    url: string;
    publicId?: string;
    width?: number;
    height?: number;
    format?: string;
  };
  gallery?: {
    url: string;
    publicId?: string;
    width?: number;
    height?: number;
    format?: string;
  }[];
  isNew: boolean;
  isBestSeller?: boolean;
  specifications?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
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
  },
  { timestamps: true }
);

// Indexes
ProductSchema.index({ category: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ stock: 1 });

// Validation hook for originalPrice
ProductSchema.pre("save", function (this: IProduct) {
  if (this.originalPrice && this.originalPrice < this.price) {
    throw new Error("Original price must be greater than or equal to current price.");
  }
});

export const Product = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
