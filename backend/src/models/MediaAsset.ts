import mongoose, { Document, Schema } from "mongoose";

export interface IMediaAsset extends Document {
  assetKey: string;
  provider: "cloudinary";
  publicId: string;
  url: string;
  secureUrl?: string;
  resourceType: "image";
  format: string;
  bytes?: number;
  width?: number;
  height?: number;
  altText?: string;
  caption?: string;
  folder?: string;
  tags?: string[];
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const mediaAssetSchema = new Schema<IMediaAsset>(
  {
    assetKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ["cloudinary"],
      default: "cloudinary",
    },
    publicId: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    secureUrl: {
      type: String,
    },
    resourceType: {
      type: String,
      required: true,
      enum: ["image"],
      default: "image",
    },
    format: {
      type: String,
      required: true,
    },
    bytes: {
      type: Number,
    },
    width: {
      type: Number,
    },
    height: {
      type: Number,
    },
    altText: {
      type: String,
    },
    caption: {
      type: String,
    },
    folder: {
      type: String,
    },
    tags: [
      {
        type: String,
      },
    ],
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent exposing internal Mongoose structure to frontend directly
mediaAssetSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const MediaAsset = mongoose.models.MediaAsset || mongoose.model<IMediaAsset>("MediaAsset", mediaAssetSchema);
