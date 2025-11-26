// src/app/api/customers/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";

export async function GET() {
  await connectDB();
  try {
    const customers = await Customer.find().sort({ name: 1 }).lean();
    return NextResponse.json({ ok: true, data: customers });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const { name, phone, address } = body;
    if (!name || !phone) return NextResponse.json({ ok: false, error: "name & phone required" }, { status: 400 });

    const existing = await Customer.findOne({ phone });
    if (existing) return NextResponse.json({ ok: false, error: "Customer with phone already exists" }, { status: 409 });

    const cust = await Customer.create({ name, phone, address });
    return NextResponse.json({ ok: true, data: cust }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
