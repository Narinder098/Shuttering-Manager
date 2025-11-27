import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import { verifyToken } from "@/lib/auth"; 

// 1. GET Single Customer
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    // 🛡️ SECURITY START 🛡️
    const cookieHeader = (req as any).cookies || null;
    const token =
      cookieHeader?.get("admin_token")?.value ||
      req.headers.get("cookie")?.split(";").find((c: string) => c.trim().startsWith("admin_token="))?.split("=")[1];

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    // 🛡️ SECURITY END 🛡️

    const { id } = await params;
    const c = await Customer.findById(id).lean();
    if (!c) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, data: c });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// 2. PUT (Update)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    // 🛡️ SECURITY START 🛡️
    const cookieHeader = (req as any).cookies || null;
    const token =
      cookieHeader?.get("admin_token")?.value ||
      req.headers.get("cookie")?.split(";").find((c: string) => c.trim().startsWith("admin_token="))?.split("=")[1];

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    // 🛡️ SECURITY END 🛡️

    const { id } = await params;
    const body = await req.json();
    const updated = await Customer.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// 3. DELETE
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  try {
    // 🛡️ SECURITY START 🛡️
    const cookieHeader = (req as any).cookies || null;
    const token =
      cookieHeader?.get("admin_token")?.value ||
      req.headers.get("cookie")?.split(";").find((c: string) => c.trim().startsWith("admin_token="))?.split("=")[1];

    if (!token || !verifyToken(token)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    // 🛡️ SECURITY END 🛡️

    const { id } = await params;
    const deleted = await Customer.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, data: deleted });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}