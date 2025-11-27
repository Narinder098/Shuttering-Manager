// src/app/api/materials/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Material from "@/models/Materials";
import { verifyToken } from "@/lib/auth";

export async function PUT(
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

export async function DELETE(
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

    const mat = await Material.findById(id);
    if (!mat) return NextResponse.json({ ok: false, error: "Material not found" }, { status: 404 });

    await Material.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}