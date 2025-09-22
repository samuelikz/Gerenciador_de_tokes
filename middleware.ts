import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const cookieName = process.env.AUTH_COOKIE_NAME || "accessToken";
  const hasToken = Boolean(req.cookies.get(cookieName)?.value);
  const { pathname } = req.nextUrl;

  // Bloqueia dashboard se não logado
  if (!hasToken && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Bloqueia tela de login se já logado
  if (hasToken && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
