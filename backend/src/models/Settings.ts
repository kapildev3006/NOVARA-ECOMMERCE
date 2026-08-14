import mongoose, { Document, Schema } from "mongoose";

export interface ISettings extends Document {
  key: string; // Should be "default"
  general: any;
  storeInfo: any;
  appearance: any;
  notifications: any;
  shipping: any;
  tax: any;
  adminProfile: any;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    general: { type: Schema.Types.Mixed },
    storeInfo: { type: Schema.Types.Mixed },
    appearance: { type: Schema.Types.Mixed },
    notifications: { type: Schema.Types.Mixed },
    shipping: { type: Schema.Types.Mixed },
    tax: { type: Schema.Types.Mixed },
    adminProfile: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

SettingsSchema.index({ key: 1 }, { unique: true });

export const Settings = mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);
