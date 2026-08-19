import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Firebase Auth uses httpOnly cookies only with firebase-admin SSR.
// For client-side auth we protect routes with a lightweight session cookie
// written by the client after login (see AuthContext redirect logic).
// Middleware checks for the presence of that cookie to gate protected routes.
const PROTECTED = ["/hub", "/forms", "/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // The client sets "auth_session=1" after successful login.
  const session = request.cookies.get("auth_session");
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/hub/:path*", "/forms/:path*", "/admin/:path*"],
};
