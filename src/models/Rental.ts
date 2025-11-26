// src/models/Rental.ts
import mongoose, { Schema, model, models, Document } from "mongoose";

export type RentalItem = {
  materialId: mongoose.Types.ObjectId;
  variantId?: mongoose.Types.ObjectId | null;
  label?: string; // snapshot label
  pricePerDay: number; // snapshot price
  qtyRented: number;
  qtyReturned: number; // starts 0
  subtotal?: number; // optional snapshot
};

export interface IRental extends Document {
  customerName?: string;
  customerPhone?: string;
  customerId?: mongoose.Types.ObjectId | null;
  items: RentalItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  rentedAt: Date;
  expectedReturnDate?: Date | null;
  actualReturnDate?: Date | null;
  status: "active" | "partial_returned" | "returned" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RentalItemSchema = new Schema<RentalItem>({
  materialId: { type: Schema.Types.ObjectId, ref: "Material", required: true },
  variantId: { type: Schema.Types.ObjectId, required: false },
  label: { type: String },
  pricePerDay: { type: Number, required: true, default: 0 },
  qtyRented: { type: Number, required: true, default: 0 },
  qtyReturned: { type: Number, required: true, default: 0 },
  subtotal: { type: Number },
});

const RentalSchema = new Schema<IRental>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: false },
    customerName: { type: String },
    customerPhone: { type: String },
    items: { type: [RentalItemSchema], default: [] },
    totalAmount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, required: true, default: 0 },
    dueAmount: { type: Number, required: true, default: 0 },
    rentedAt: { type: Date, default: () => new Date() },
    expectedReturnDate: { type: Date },
    actualReturnDate: { type: Date },
    status: { type: String, enum: ["active", "partial_returned", "returned", "cancelled"], default: "active" },
    notes: { type: String },
  },
  { timestamps: true }
);

export default (models.Rental as mongoose.Model<IRental>) || model<IRental>("Rental", RentalSchema);
