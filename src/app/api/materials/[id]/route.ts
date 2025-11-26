// src/app/api/materials/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Material from "@/models/Materials";

export async function PUT(req: Request, context: { params: { id: string } }) {
  await connectDB();
  const { id } = context.params;
  try {
    const body = await req.json();
    const update: any = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.category !== undefined) update.category = body.category;
    if (body.description !== undefined) update.description = body.description;

    const updated = await Material.findByIdAndUpdate(id, update, { new: true });
    if (!updated) return NextResponse.json({ ok: false, error: "Material not found" }, { status: 404 });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: { id: string } }) {
  await connectDB();
  const { id } = context.params;
  try {
    const mat = await Material.findById(id);
    if (!mat) return NextResponse.json({ ok: false, error: "Material not found" }, { status: 404 });

    // Optional: check rentals referencing material before deletion (not implemented)
    await Material.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
