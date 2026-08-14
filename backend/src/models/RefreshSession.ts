import mongoose, { Document, Schema } from "mongoose";

export interface IRefreshSession extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string; // Hash of the refresh token to prevent plaintext storage
  expiresAt: Date;
  revokedAt?: Date;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshSessionSchema = new Schema<IRefreshSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    userAgent: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

// Indexes
RefreshSessionSchema.index({ userId: 1 });
RefreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index to auto-delete expired sessions
RefreshSessionSchema.index({ tokenHash: 1 });

export const RefreshSession =
  mongoose.models.RefreshSession || mongoose.model<IRefreshSession>("RefreshSession", RefreshSessionSchema);
