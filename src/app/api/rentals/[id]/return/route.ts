// src/app/api/rentals/[id]/return/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import RentalModel from "@/models/Rental";
import Material from "@/models/Materials";

export async function PUT(req: Request, context: any) {
  await connectDB();

  const { id } = await context.params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ ok: false, error: "Invalid rental ID" }, { status: 400 });
  }

  try {
    const { returnedItems } = await req.json();

    if (!Array.isArray(returnedItems) || returnedItems.length === 0) {
      return NextResponse.json({ ok: false, error: "returnedItems required" }, { status: 400 });
    }

    const rental = await RentalModel.findById(id);
    if (!rental) return NextResponse.json({ ok: false, error: "Rental not found" }, { status: 404 });

    for (const ret of returnedItems) {
      const { materialId, variantId, quantityReturned } = ret;
      const qty = Number(quantityReturned || 0);

      if (!materialId || qty <= 0) continue;

      const item = rental.items.find(i =>
        String(i.materialId) === String(materialId) &&
        String(i.variantId || "") === String(variantId || "")
      );

      if (!item) {
        return NextResponse.json({ ok: false, error: `Rental item not found for material ${materialId}` }, { status: 404 });
      }

      const remaining = item.qtyRented - item.qtyReturned;

      // 🚫 BLOCK return if already fully returned
      if (remaining <= 0) {
        return NextResponse.json({
          ok: false,
          error: `All items already returned for ${item.label}`
        }, { status: 400 });
      }

      // ✔ allow only up to remaining
      const toReturn = Math.min(remaining, qty);

      // update stock
      if (variantId) {
        await Material.updateOne(
          { _id: materialId, "variants._id": variantId },
          {
            $inc: {
              "variants.$.availableQuantity": toReturn,
              availableQuantity: toReturn,
            },
          }
        );
      } else {
        await Material.updateOne(
          { _id: materialId },
          { $inc: { availableQuantity: toReturn } }
        );
      }

      // update rental item return
      item.qtyReturned += toReturn;
    }

    rental.status = rental.items.every(i => i.qtyReturned >= i.qtyRented)
      ? "returned"
      : "partial_returned";

    await rental.save();

    return NextResponse.json({ ok: true, data: rental });

  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
