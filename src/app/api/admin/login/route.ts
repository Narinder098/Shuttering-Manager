import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  await connectDB();
  const { email, password } = await req.json();

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 404 });
  }

  const match = await bcrypt.compare(password, admin.password);
  if (!match) {
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }

  const token = signToken({
    id: admin._id,
    role: admin.role,
    name: admin.name,
    email: admin.email,
  });

  // Set HTTP-only cookie
  const res = NextResponse.json({
    ok: true,
    data: { name: admin.name, email: admin.email, role: admin.role },
  });

  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res;
}
