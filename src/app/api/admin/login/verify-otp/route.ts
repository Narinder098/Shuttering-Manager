// src/app/api/admin/login/verify-otp/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import AdminOtp from "@/models/AdminOtp";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  await connectDB();
  try {
    const { identifier, code } = await req.json();
    if (!identifier || !code) return NextResponse.json({ ok: false, error: "identifier & code required" }, { status: 400 });

    const admin = await Admin.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (!admin) return NextResponse.json({ ok: false, error: "Admin not found" }, { status: 404 });

    const otpDoc = await AdminOtp.findOne({ admin: admin._id, code }).sort({ createdAt: -1 });
    if (!otpDoc) return NextResponse.json({ ok: false, error: "Invalid OTP" }, { status: 401 });

    if (otpDoc.expiresAt < new Date()) {
      await AdminOtp.deleteMany({ admin: admin._id });
      return NextResponse.json({ ok: false, error: "OTP expired" }, { status: 401 });
    }

    // OTP valid -> delete all OTPs for admin
    await AdminOtp.deleteMany({ admin: admin._id });

    // issue JWT
    const token = signToken({ id: admin._id, name: admin.name, role: admin.role, email: admin.email });

    const res = NextResponse.json({ ok: true, data: { name: admin.name, email: admin.email, role: admin.role } });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
