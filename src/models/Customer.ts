import mongoose, { Schema, model, models } from "mongoose";

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
  },
  { timestamps: true }
);

export default models.Customer || model("Customer", CustomerSchema);
