// src/app/api/materials/[id]/variants/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Material from "@/models/Materials";
import { verifyToken } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;

  try {
    // --- SECURITY BLOCK ---
    const cookieHeader = (req as any).cookies || null;
    const token = cookieHeader?.get("admin_token")?.value || req.headers.get("cookie")?.split(";").find((c: string) => c.trim().startsWith("admin_token="))?.split("=")[1];

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    // ----------------------

    const body = await req.json();
    const { label, pricePerDay, totalQuantity } = body;

    const mat = await Material.findById(id);
    if (!mat) {
      return NextResponse.json({ ok: false, error: "Material not found" }, { status: 404 });
    }

    mat.variants.push({
      label,
      pricePerDay,
      totalQuantity,
      availableQuantity: totalQuantity,
    });

    // Recalculate totals
    mat.totalQuantity = mat.variants.reduce((a: number, v: any) => a + v.totalQuantity, 0);
    mat.availableQuantity = mat.variants.reduce((a: number, v: any) => a + v.availableQuantity, 0);

    await mat.save();

    return NextResponse.json({ ok: true, data: mat });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}