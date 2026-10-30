import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { env } from "./config/env";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // Get the token
  const token = req.cookies.get(env.AUTH_COOKIE)?.value;
  // Verify it
  const session = await verifyToken(token);

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[middleware] ${pathname} | cookie: ${token ? "yes" : "NO"} | valid: ${session ? "yes" : "NO"} | secret length: ${process.env.JWT_SECRET?.length ?? "MISSING"}`,
    );
  }

  const isDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAuthPage =
    pathname === "/auth/login" || pathname === "/auth/register";

  if (isDashboard && !session) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("from", pathname + search);
    const res = NextResponse.redirect(loginUrl);
    // Expired or tampered cookie: remove it so we don't re-verify junk on every request.
    if (token) res.cookies.delete(env.AUTH_COOKIE);
    return res;
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

// Only run on these paths: static files, images and API routes skip middleware entirely.
export const config = {
  matcher: ["/dashboard/:path*", "/auth/login", "/auth/register"],
};
