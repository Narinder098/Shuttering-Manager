import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Material from "@/models/Materials";

export async function PUT(
  req: Request,
  context: { params: { id: string; variantId: string } }
) {
  await connectDB();
  const { id, variantId } = await context.params;

  try {
    const mat = await Material.findById(id);
    if (!mat)
      return NextResponse.json(
        { ok: false, error: "Material not found" },
        { status: 404 }
      );

    const body = await req.json();

    const variant = mat.variants.id(variantId);
    if (!variant)
      return NextResponse.json(
        { ok: false, error: "Variant not found" },
        { status: 404 }
      );

    variant.label = body.label;
    variant.pricePerDay = body.pricePerDay;
    variant.totalQuantity = body.totalQuantity;
    variant.availableQuantity = body.totalQuantity;

    mat.totalQuantity = mat.variants.reduce(
      (a: number, v: { totalQuantity: number; availableQuantity: number }) =>
        a + v.totalQuantity,
      0
    );
    mat.availableQuantity = mat.variants.reduce(
      (a: number, v: { totalQuantity: number; availableQuantity: number }) =>
        a + v.availableQuantity,
      0
    );

    await mat.save();

    return NextResponse.json({ ok: true, data: mat });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}

export async function DELETE(
  req: Request,
  context: { params: { id: string; variantId: string } }
) {
  await connectDB();
  const { id, variantId } = await context.params;

  try {
    const mat = await Material.findById(id);
    if (!mat)
      return NextResponse.json(
        { ok: false, error: "Material not found" },
        { status: 404 }
      );

    const variant = mat.variants.id(variantId);
    if (!variant)
      return NextResponse.json(
        { ok: false, error: "Variant not found" },
        { status: 404 }
      );

    variant.deleteOne();

    mat.totalQuantity = mat.variants.reduce(
      (a: number, v: { totalQuantity: number; availableQuantity: number }) =>
        a + v.totalQuantity,
      0
    );
    mat.availableQuantity = mat.variants.reduce(
      (a: number, v: { totalQuantity: number; availableQuantity: number }) =>
        a + v.availableQuantity,
      0
    );

    await mat.save();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
