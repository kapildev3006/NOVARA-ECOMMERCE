import mongoose, { Document, Schema } from "mongoose";

export interface IHomepageCampaign extends Document {
  campaignKey: string;
  name: string;
  description?: string;
  revisionId: number;
  status: "draft" | "scheduled" | "executing" | "active" | "completed" | "cancelled";
  startsAt?: Date;
  endsAt?: Date;
  fallbackRevisionId?: number;
  createdBy: mongoose.Types.ObjectId;
  scheduledBy?: mongoose.Types.ObjectId;
  activatedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HomepageCampaignSchema = new Schema<IHomepageCampaign>(
  {
    campaignKey: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    revisionId: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["draft", "scheduled", "executing", "active", "completed", "cancelled"], 
      required: true,
      default: "draft"
    },
    startsAt: { type: Date },
    endsAt: { type: Date },
    fallbackRevisionId: { type: Number },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    scheduledBy: { type: Schema.Types.ObjectId, ref: "User" },
    activatedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes for querying active/scheduled campaigns efficiently
HomepageCampaignSchema.index({ status: 1, startsAt: 1 });
HomepageCampaignSchema.index({ status: 1, endsAt: 1 });

export const HomepageCampaign =
  mongoose.models.HomepageCampaign || mongoose.model<IHomepageCampaign>("HomepageCampaign", HomepageCampaignSchema);
