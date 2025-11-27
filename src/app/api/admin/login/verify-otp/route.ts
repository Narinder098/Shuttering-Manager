import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import AdminOtp from "@/models/AdminOtp";
import { signToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  await connectDB();

  try {
    // Limit OTP attempts to prevent brute-forcing the 6-digit code
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = rateLimit(ip + "_verify", 5, 60000); // 5 attempts per minute

    if (!isAllowed) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please wait 1 minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const identifier = String(body.identifier || "").trim();
    const code = String(body.code || "").trim();

    if (!identifier || !code) {
      return NextResponse.json({ ok: false, error: "identifier & code required" }, { status: 400 });
    }

    const admin = await Admin.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (!admin) return NextResponse.json({ ok: false, error: "Admin not found" }, { status: 404 });

    // 2. VERIFY OTP
    const otpDoc = await AdminOtp.findOne({ admin: admin._id, code }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return NextResponse.json({ ok: false, error: "Invalid verification code" }, { status: 401 });
    }

    if (otpDoc.expiresAt < new Date()) {
      await AdminOtp.deleteMany({ admin: admin._id });
      return NextResponse.json({ ok: false, error: "Verification code expired" }, { status: 401 });
    }

    // OTP valid -> Clean up used codes
    await AdminOtp.deleteMany({ admin: admin._id });

    // 3. ISSUE SECURE TOKEN
    const token = signToken({ id: admin._id, name: admin.name, role: admin.role, email: admin.email });

    const res = NextResponse.json({ ok: true, data: { name: admin.name, email: admin.email, role: admin.role } });
    
    // 🛡️ SECURITY FIX #4: HttpOnly Cookie
    res.cookies.set("admin_token", token, {
      httpOnly: true, // This hides it from document.cookie
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in prod
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "strict" // CSRF Protection
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}