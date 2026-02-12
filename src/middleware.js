import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "eclassroom-secret"
);

export async function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Public routes - allow access
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/first-login") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/api/school-info"
  ) {
    // If logged in and trying to access login, redirect to dashboard or first-login
    if (pathname.startsWith("/login") && token) {
      try {
        const { payload } = await jwtVerify(token, secret);
        if (payload.mustChangePassword) {
          return NextResponse.redirect(new URL("/first-login", request.url));
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch {
        // Invalid token, let them access login
      }
    }
    return NextResponse.next();
  }

  // Protected routes - check auth
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    
    // Check if user must change password
    if (payload.mustChangePassword && !pathname.startsWith("/first-login")) {
      return NextResponse.redirect(new URL("/first-login", request.url));
    }
    
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
