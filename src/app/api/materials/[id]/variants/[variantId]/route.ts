// src/app/api/materials/[id]/variants/[variantId]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Material from "@/models/Materials";
import { verifyToken } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  await connectDB();
  const { id, variantId } = await params;

  try {
    // --- SECURITY BLOCK ---
    const cookieHeader = (req as any).cookies || null;
    const token = cookieHeader?.get("admin_token")?.value || req.headers.get("cookie")?.split(";").find((c: string) => c.trim().startsWith("admin_token="))?.split("=")[1];

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    // ----------------------

    const mat = await Material.findById(id);
    if (!mat) return NextResponse.json({ ok: false, error: "Material not found" }, { status: 404 });

    const body = await req.json();

    const variant = mat.variants.id(variantId);
    if (!variant) return NextResponse.json({ ok: false, error: "Variant not found" }, { status: 404 });

    // Update fields
    variant.label = body.label;
    variant.pricePerDay = body.pricePerDay;
    variant.totalQuantity = body.totalQuantity;
    // Note: This logic resets available qty to max. Adjust if you want to preserve rentals.
    variant.availableQuantity = body.totalQuantity;

    // Recalculate totals
    mat.totalQuantity = mat.variants.reduce((a: number, v: any) => a + v.totalQuantity, 0);
    mat.availableQuantity = mat.variants.reduce((a: number, v: any) => a + v.availableQuantity, 0);

    await mat.save();

    return NextResponse.json({ ok: true, data: mat });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  await connectDB();
  const { id, variantId } = await params;

  try {
    // --- SECURITY BLOCK ---
    const cookieHeader = (req as any).cookies || null;
    const token = cookieHeader?.get("admin_token")?.value || req.headers.get("cookie")?.split(";").find((c: string) => c.trim().startsWith("admin_token="))?.split("=")[1];

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    // ----------------------

    const mat = await Material.findById(id);
    if (!mat) return NextResponse.json({ ok: false, error: "Material not found" }, { status: 404 });

    const variant = mat.variants.id(variantId);
    if (!variant) return NextResponse.json({ ok: false, error: "Variant not found" }, { status: 404 });

    variant.deleteOne();

    // Recalculate totals
    mat.totalQuantity = mat.variants.reduce((a: number, v: any) => a + v.totalQuantity, 0);
    mat.availableQuantity = mat.variants.reduce((a: number, v: any) => a + v.availableQuantity, 0);

    await mat.save();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}