// src/app/api/rentals/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import RentalModel from "@/models/Rental";

export async function GET(req: Request, context: any) {
  await connectDB();

  const { id } = await context.params; // ← Required in App Router

  try {
    const r = await RentalModel.findById(id).lean();
    if (!r) return NextResponse.json({ ok: false, error: "Rental not found" }, { status: 404 });

    return NextResponse.json({ ok: true, data: r });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, context: any) {
  await connectDB();

  const { id } = await context.params; // ← FIX

  try {
    const body = await req.json();
    const add = Number(body.addPayment || 0);
    if (!add || add <= 0)
      return NextResponse.json({ ok: false, error: "addPayment required" }, { status: 400 });

    const rental = await RentalModel.findById(id);
    if (!rental)
      return NextResponse.json({ ok: false, error: "Rental not found" }, { status: 404 });

    rental.paidAmount = (rental.paidAmount || 0) + add;
    rental.dueAmount = Math.max(0, rental.totalAmount - rental.paidAmount);

    await rental.save();

    return NextResponse.json({ ok: true, data: rental });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
