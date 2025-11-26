// src/app/api/customers/[id]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";

// 1. GET
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Type changed to Promise
) {
  await connectDB();
  try {
    const { id } = await params; // Await params here
    const c = await Customer.findById(id).lean();
    if (!c) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, data: c });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

// 2. PUT
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Type changed to Promise
) {
  await connectDB();
  try {
    const { id } = await params; // Await params here
    const body = await req.json();
    const updated = await Customer.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

// 3. DELETE
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // Type changed to Promise
) {
  await connectDB();
  try {
    const { id } = await params; // Await params here
    const deleted = await Customer.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, data: deleted });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}