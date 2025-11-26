import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  await connectDB();
  const { name, email, phone, password, role = "admin" } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Email & Password required" }, { status: 400 });
  }

  const exists = await Admin.findOne({ email });
  if (exists) {
    return NextResponse.json({ ok: false, error: "Admin already exists" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const admin = await Admin.create({
    name,
    email,
    phone,
    password: hashed,
    role,
  });

  return NextResponse.json({ ok: true, data: admin });
}
