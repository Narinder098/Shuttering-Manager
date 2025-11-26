// src/app/api/materials/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Material from "@/models/Materials";

export async function GET() {
  await connectDB();
  try {
    const list = await Material.find().sort({ name: 1 }).lean();
    // Ensure parent totals exist (compute if missing)
    const normalized = list.map((m: any) => {
      const total = (m.variants || []).reduce((s: number, v: any) => s + (Number(v.totalQuantity) || 0), 0);
      const avail = (m.variants || []).reduce((s: number, v: any) => s + (Number(v.availableQuantity) || 0), 0);
      return {
        ...m,
        totalQuantity: Number(m.totalQuantity ?? total),
        availableQuantity: Number(m.availableQuantity ?? avail),
      };
    });
    return NextResponse.json({ ok: true, data: normalized });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const { name, category = "", description = "", variants = [] } = body;

    if (!name) return NextResponse.json({ ok: false, error: "name required" }, { status: 400 });

    // prepare variants: set availableQuantity = totalQuantity if missing
    const prepared = (variants || []).map((v: any) => ({
      label: String(v.label || v.size || "default"),
      pricePerDay: Number(v.pricePerDay || 0),
      totalQuantity: Number(v.totalQuantity || 0),
      availableQuantity: Number(v.availableQuantity ?? v.totalQuantity ?? 0),
    }));

    const total = prepared.reduce((s: number, x: any) => s + (Number(x.totalQuantity) || 0), 0);
    const avail = prepared.reduce((s: number, x: any) => s + (Number(x.availableQuantity) || 0), 0);

    const material = await Material.create({
      name,
      category,
      description,
      variants: prepared,
      totalQuantity: total,
      availableQuantity: avail,
    });

    return NextResponse.json({ ok: true, data: material });
  } catch (err: any) {
    // duplicate key handling
    if (err.code === 11000) {
      return NextResponse.json({ ok: false, error: "Material with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
