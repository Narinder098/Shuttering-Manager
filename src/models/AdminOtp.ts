// src/models/AdminOtp.ts
import mongoose, { Schema, model, models } from "mongoose";

const AdminOtpSchema = new Schema(
  {
    admin: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Optional: TTL index to auto-delete expired docs (Mongo will delete after expiresAt)
AdminOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default models.AdminOtp || model("AdminOtp", AdminOtpSchema);
