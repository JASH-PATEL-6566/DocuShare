import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ["/dashboard"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Auth routes
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // For middleware, we can't access sessionStorage directly
  // We'll let the client-side code handle the authentication check
  // and only do basic path-based redirects here

  // If we're on a protected route, let the client handle auth check
  if (isProtectedRoute) {
    // We'll let the client-side code handle this
    return NextResponse.next();
  }

  // For auth routes, also let the client handle it
  if (isAuthRoute) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
