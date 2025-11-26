// src/app/api/admin/login/password/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  await connectDB();
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "email & password required" }, { status: 400 });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });

    const match = await bcrypt.compare(password, admin.password || "");
    if (!match) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });

    const token = signToken({ id: admin._id, name: admin.name, role: admin.role, email: admin.email });

    const res = NextResponse.json({ ok: true, data: { name: admin.name, email: admin.email, role: admin.role } });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
