// import mongoose, { Schema, model, models } from "mongoose";

// const MaterialSchema = new Schema(
//   {
//     name: { type: String, required: true, unique: true },
//     pricePerDay: { type: Number, required: true },
//     totalQuantity: { type: Number, required: true },
//     availableQuantity: { type: Number, required: true },
//   },
//   { timestamps: true }
// );

// export default models.Material || model("Material", MaterialSchema);

  
import mongoose, { Schema, model, models } from "mongoose";

const VariantSchema = new Schema(
  {
    label: { type: String, required: true }, // "15 inch", "7 ft"
    pricePerDay: { type: Number, required: true, default: 0 },
    totalQuantity: { type: Number, required: true, default: 0 },
    availableQuantity: { type: Number, required: true, default: 0 },
  },
  { _id: true }
);

const MaterialSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    category: { type: String, default: "" },
    description: { type: String, default: "" },
    // variants array
    variants: { type: [VariantSchema], default: [] },

    // parent totals (kept in sync by APIs)
    totalQuantity: { type: Number, default: 0 },
    availableQuantity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// optional helper: recompute totals when saving via model methods
MaterialSchema.methods.recomputeTotals = function () {
  const v = this.variants || [];
  this.totalQuantity = v.reduce((s: number, x: any) => s + (Number(x.totalQuantity) || 0), 0);
  this.availableQuantity = v.reduce((s: number, x: any) => s + (Number(x.availableQuantity) || 0), 0);
};

export default models.Material || model("Material", MaterialSchema);
