import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import AdminOtp from "@/models/AdminOtp"; // Import the OTP model
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: Request) {
  await connectDB();
  try {
    // 1. Get token
    const cookieHeader = (req as any).cookies || null;
    const token =
      cookieHeader?.get("admin_token")?.value ||
      req.headers.get("cookie")?.split("; ").find((c) => c.startsWith("admin_token="))?.split("=")[1];

    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify Token
    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === "string") {
      return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });
    }

    // 3. Destructure OTP from request
    const { name, newPassword, otp } = await req.json();

    // 4. Fetch Admin
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Admin not found" }, { status: 404 });
    }

    // 5. Update Name
    if (name) admin.name = name;

    // 6. Update Password (OTP Verification Flow)
    if (newPassword) {
      if (!otp) {
        return NextResponse.json({ ok: false, error: "OTP is required to change password" }, { status: 400 });
      }

      // Verify OTP
      const otpDoc = await AdminOtp.findOne({ admin: admin._id, code: otp }).sort({ createdAt: -1 });

      if (!otpDoc) {
        return NextResponse.json({ ok: false, error: "Invalid OTP" }, { status: 400 });
      }

      if (otpDoc.expiresAt < new Date()) {
        await AdminOtp.deleteMany({ admin: admin._id });
        return NextResponse.json({ ok: false, error: "OTP has expired" }, { status: 400 });
      }

      // OTP is valid - Delete used OTPs
      await AdminOtp.deleteMany({ admin: admin._id });

      // Hash and set new password
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(newPassword, salt);
    }

    await admin.save();

    return NextResponse.json({ ok: true, message: "Profile updated successfully" });
  } catch (err: any) {
    console.error("Update Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}