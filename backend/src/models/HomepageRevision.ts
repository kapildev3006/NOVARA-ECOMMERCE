import mongoose, { Document, Schema } from "mongoose";
import { IHomepageSection } from "./HomepageSection";

export interface IHomepageRevision extends Document {
  revisionId: number;
  status: "draft" | "published";
  sections: mongoose.Types.DocumentArray<IHomepageSection>;
  publishedAt?: Date;
  publishedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Create a copy of the section schema for embedding without global unique indices
const EmbeddedSectionSchema = new Schema(
  {
    sectionKey: { type: String, required: true }, // No unique: true here!
    type: { type: String, required: true },
    title: { type: String },
    subtitle: { type: String },
    enabled: { type: Boolean, default: true },
    order: { type: Number, required: true },
    isProtected: { type: Boolean, default: false },
    config: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const HomepageRevisionSchema = new Schema<IHomepageRevision>(
  {
    revisionId: { type: Number, required: true, unique: true },
    status: { type: String, enum: ["draft", "published"], required: true },
    sections: [EmbeddedSectionSchema],
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const HomepageRevision =
  mongoose.models.HomepageRevision || mongoose.model<IHomepageRevision>("HomepageRevision", HomepageRevisionSchema);
