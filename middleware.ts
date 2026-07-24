import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Marketing / learner screens that an ADMIN should never land on.
// Admins are kept inside the admin panel and redirected to /admin.
const ADMIN_BLOCKED_PREFIXES = [
  "/dashboard",
  "/learn",
  "/blog",
  "/ebooks",
  "/quiz",
  "/study",
  "/payment",
];

function isAdminBlocked(pathname: string) {
  if (pathname === "/") {
    return true;
  }
  return ADMIN_BLOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAllowed(pathname: string, role?: string) {
  if (pathname.startsWith("/admin")) {
    return role === "ADMIN";
  }

  if (pathname.startsWith("/instructor")) {
    return role === "ADMIN" || role === "INSTRUCTOR";
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/study") ||
    pathname.startsWith("/payment") ||
    pathname.startsWith("/live") ||
    (pathname.includes("/ebooks/") && pathname.endsWith("/read"))
  ) {
    return Boolean(role);
  }

  return true;
}

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const pathname = request.nextUrl.pathname;
  const role = token?.role as string | undefined;

  // Admins only see admin views. Live hosting/viewing stays available.
  if (role === "ADMIN" && !pathname.startsWith("/live") && isAdminBlocked(pathname)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isAllowed(pathname, role)) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/login", request.url);
  signInUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/instructor/:path*",
    "/dashboard/:path*",
    "/learn/:path*",
    "/blog/:path*",
    "/ebooks/:path*",
    "/quiz/:path*",
    "/study/:path*",
    "/payment/:path*",
    "/live/:path*",
  ],
};
