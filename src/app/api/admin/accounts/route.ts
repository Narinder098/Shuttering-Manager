import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth";

export async function PUT(req: Request) {
  await connectDB();
  try {
    // 1. Get token
    // Use reliable cookie extraction for Next.js App Router
    const cookieHeader = (req as any).cookies || null;
    const token =
      cookieHeader?.get("admin_token")?.value ||
      req.headers.get("cookie")?.split("; ").find((c) => c.startsWith("admin_token="))?.split("=")[1];

    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify
    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === "string") {
      return NextResponse.json({ ok: false, error: "Invalid token" }, { status: 401 });
    }

    const { name, currentPassword, newPassword } = await req.json();

    // 3. Fetch Admin
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Admin not found" }, { status: 404 });
    }

    // 4. Update Name
    if (name) admin.name = name;

    // 5. Update Password (if requested)
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ ok: false, error: "Current password required" }, { status: 400 });
      }
      
      // Verify current password
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return NextResponse.json({ ok: false, error: "Incorrect current password" }, { status: 400 });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(newPassword, salt);
    }

    await admin.save();

    return NextResponse.json({ ok: true, message: "Profile updated" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}