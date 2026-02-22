import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Paths that are completely public
const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/api/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Quick skip for static files and internal next routing
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(svg|png|jpg|jpeg)$/)
  ) {
    return NextResponse.next();
  }

  // Allow raw /api calls to pass through unhindered (handled by API logic)
  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth/proxy")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  const role = request.cookies.get("user_role")?.value as
    | "admin"
    | "provider"
    | "client"
    | undefined;

  // 1. If trying to access login while ALREADY authenticated, redirect to their dashboard
  if (pathname === "/login" && token && role) {
    if (role === "admin")
      return NextResponse.redirect(new URL("/admin", request.url));
    if (role === "provider")
      return NextResponse.redirect(new URL("/provider", request.url));
    return NextResponse.redirect(new URL("/client", request.url));
  }

  // We only start restricting dashboard paths beyond this point
  // The user requested that each role can ONLY access their specific dashboard

  const isAccessingAdmin = pathname.startsWith("/admin");
  const isAccessingProvider = pathname.startsWith("/provider");
  const isAccessingClient = pathname.startsWith("/client");

  // If they are accessing a protected route but have NO token, bounce to login
  if (
    !token &&
    (isAccessingAdmin || isAccessingProvider || isAccessingClient)
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Role-based isolation
  if (token) {
    if (isAccessingAdmin && role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url)); // Or a 403 page
    }
    if (isAccessingProvider && role !== "provider") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // We can assume clients can only access /client. If an admin tries to hit /client,
    // in many systems that's fine, but to strictly enforce "each role can only access their dashboards only":
    if (isAccessingClient && role !== "client") {
      if (role === "admin")
        return NextResponse.redirect(new URL("/admin", request.url));
      if (role === "provider")
        return NextResponse.redirect(new URL("/provider", request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
