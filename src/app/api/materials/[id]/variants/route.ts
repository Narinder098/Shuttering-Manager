import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Material from "@/models/Materials";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  // 1. Await the params
  const { id } = await params;

  try {
    const body = await req.json();
    const { label, pricePerDay, totalQuantity } = body;

    const mat = await Material.findById(id);
    if (!mat) {
      return NextResponse.json(
        { ok: false, error: "Material not found" },
        { status: 404 }
      );
    }

    // Mongoose subdocument push
    mat.variants.push({
      label,
      pricePerDay,
      totalQuantity,
      availableQuantity: totalQuantity,
    });

    // Recalculate totals
    mat.totalQuantity = mat.variants.reduce(
      (a: number, v: { totalQuantity: number }) => a + v.totalQuantity,
      0
    );
    mat.availableQuantity = mat.variants.reduce(
      (a: number, v: { availableQuantity: number }) => a + v.availableQuantity,
      0
    );

    await mat.save();

    return NextResponse.json({ ok: true, data: mat });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}