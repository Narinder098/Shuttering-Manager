// src/app/api/rentals/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import RentalModel from "@/models/Rental";
import Material from "@/models/Materials";

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const { customerName, customerPhone, expectedReturnDate, items = [], paidAmount = 0 } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false, error: "items required" }, { status: 400 });
    }

    const normalizedItems: any[] = [];
    let totalAmount = 0;

    for (const it of items) {
      const qty = Number(it.qtyRented);
      const price = Number(it.pricePerDay);

      if (!it.materialId) return NextResponse.json({ ok: false, error: "materialId missing" });
      if (qty <= 0) return NextResponse.json({ ok: false, error: "qtyRented invalid" });

      if (it.variantId) {
        const res = await Material.updateOne(
          {
            _id: it.materialId,
            "variants._id": it.variantId,
            "variants.availableQuantity": { $gte: qty }
          },
          {
            $inc: {
              "variants.$.availableQuantity": -qty,
              availableQuantity: -qty
            }
          }
        );

        if (!res.modifiedCount) {
          return NextResponse.json({ ok: false, error: "Variant out of stock" }, { status: 409 });
        }

        const v = await Material.findOne(
          { _id: it.materialId, "variants._id": it.variantId },
          { "variants.$": 1 }
        );

        normalizedItems.push({
          materialId: it.materialId,
          variantId: it.variantId,
          label: v?.variants?.[0]?.label || "",
          pricePerDay: price,
          qtyRented: qty,
          qtyReturned: 0,
          subtotal: qty * price
        });

        totalAmount += qty * price;
      } else {
        const res = await Material.updateOne(
          { _id: it.materialId, availableQuantity: { $gte: qty } },
          { $inc: { availableQuantity: -qty } }
        );

        if (!res.modifiedCount) {
          return NextResponse.json({ ok: false, error: "Material out of stock" }, { status: 409 });
        }

        const m = await Material.findById(it.materialId);

        normalizedItems.push({
          materialId: it.materialId,
          variantId: null,
          label: m?.name || "",
          pricePerDay: price,
          qtyRented: qty,
          qtyReturned: 0,
          subtotal: qty * price
        });

        totalAmount += qty * price;
      }
    }

    const paid = Number(paidAmount || 0);
    const due = totalAmount - paid;

    const rental = await RentalModel.create({
      customerName,
      customerPhone,
      items: normalizedItems,
      totalAmount,
      paidAmount: paid,
      dueAmount: due,
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null
    });

    return NextResponse.json({ ok: true, data: rental });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}

export async function GET(req: Request) {
  await connectDB();
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") || "";
    const page = Number(url.searchParams.get("page") || 1);
    const limit = 20;

    const filter: any = {};
    if (q) {
      filter.$or = [
        { customerName: { $regex: q, $options: "i" } },
        { customerPhone: { $regex: q, $options: "i" } }
      ];
    }

    const data = await RentalModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
