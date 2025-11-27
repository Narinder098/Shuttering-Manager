import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Customer from "@/models/Customer";
import { verifyToken } from "@/lib/auth"; // Import auth helper

export async function GET(req: Request) {
  await connectDB();
  try {
    // 🛡️ SECURITY START 🛡️
    const cookieHeader = (req as any).cookies || null;
    const token =
      cookieHeader?.get("admin_token")?.value ||
      req.headers.get("cookie")?.split(";").find((c: string) => c.trim().startsWith("admin_token="))?.split("=")[1];

    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });
    }
    // 🛡️ SECURITY END 🛡️

    const customers = await Customer.find().sort({ name: 1 }).lean();
    return NextResponse.json({ ok: true, data: customers });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    // 🛡️ SECURITY START 🛡️
    const cookieHeader = (req as any).cookies || null;
    const token =
      cookieHeader?.get("admin_token")?.value ||
      req.headers.get("cookie")?.split(";").find((c: string) => c.trim().startsWith("admin_token="))?.split("=")[1];

    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });
    }
    // 🛡️ SECURITY END 🛡️

    const body = await req.json();
    const { name, phone, address } = body;
    if (!name || !phone) return NextResponse.json({ ok: false, error: "name & phone required" }, { status: 400 });

    const existing = await Customer.findOne({ phone });
    if (existing) return NextResponse.json({ ok: false, error: "Customer with phone already exists" }, { status: 409 });

    const cust = await Customer.create({ name, phone, address });
    return NextResponse.json({ ok: true, data: cust }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}