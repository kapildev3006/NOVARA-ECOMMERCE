import mongoose, { Document, Schema } from "mongoose";

export interface IHomepageSection extends Document {
  sectionKey: string;
  type: string;
  title?: string;
  subtitle?: string;
  enabled: boolean;
  order: number;
  isProtected: boolean;
  config?: any; // Mixed type for flexibility
  createdAt: Date;
  updatedAt: Date;
}

export const HomepageSectionSchema = new Schema<IHomepageSection>(
  {
    sectionKey: { type: String, required: true, unique: true },
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

HomepageSectionSchema.index({ enabled: 1, order: 1 });

export const HomepageSection =
  mongoose.models.HomepageSection || mongoose.model<IHomepageSection>("HomepageSection", HomepageSectionSchema);
