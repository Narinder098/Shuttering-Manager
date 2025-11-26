import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define paths
  const isLoginPage = path.startsWith("/admin/login");
  const isAdminRoute = path.startsWith("/admin");

  // Get the token from cookies
  const token = request.cookies.get("admin_token")?.value;

  // SCENARIO 1: User tries to access Admin pages (Dashboard, Rentals, etc.)
  // Condition: Is Admin Route AND is NOT Login Page AND has NO Token
  if (isAdminRoute && !isLoginPage && !token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // SCENARIO 2: User tries to access Login Page but is ALREADY Logged In
  // Condition: Is Login Page AND HAS Token
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // Allow request to proceed
  return NextResponse.next();
}

export const config = {
  // Apply to all admin routes
  matcher: ["/admin/:path*"],
};