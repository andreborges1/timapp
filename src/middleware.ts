import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USER_PROTECTED = ["/dashboard", "/calendar", "/attendance", "/profile"];
const HOST_PROTECTED = ["/host/dashboard", "/host/events", "/host/scan", "/host/reports"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Host routes — check for host-token cookie
  if (HOST_PROTECTED.some((p) => pathname.startsWith(p))) {
    const hostToken = request.cookies.get("host-token");
    if (!hostToken) {
      return NextResponse.redirect(new URL("/host/login", request.url));
    }
    return NextResponse.next();
  }

  // User routes — check for any NextAuth session cookie
  if (USER_PROTECTED.some((p) => pathname.startsWith(p))) {
    const sessionToken =
      request.cookies.get("authjs.session-token") ||
      request.cookies.get("__Secure-authjs.session-token") ||
      request.cookies.get("next-auth.session-token") ||
      request.cookies.get("__Secure-next-auth.session-token");
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/calendar/:path*",
    "/attendance/:path*",
    "/profile/:path*",
    "/host/dashboard/:path*",
    "/host/events/:path*",
    "/host/scan/:path*",
    "/host/reports/:path*",
  ],
};
