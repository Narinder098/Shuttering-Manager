// src/app/api/admin/me/route.ts
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // Secure & reliable cookie read
    const cookieHeader = (req as any).cookies || null;
    const token =
      cookieHeader?.get("admin_token")?.value ||
      req.headers
        .get("cookie")
        ?.split("; ")
        .find((c) => c.startsWith("admin_token="))
        ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ ok: false, admin: null });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ ok: false, admin: null });
    }

    return NextResponse.json({ ok: true, admin: decoded });
  } catch (err) {
    return NextResponse.json({ ok: false, admin: null });
  }
}
