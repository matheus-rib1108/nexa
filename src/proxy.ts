import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login", "/registro", "/recuperar-senha", "/redefinir-senha", "/privacidade"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/icons");

  if (isPublic) return NextResponse.next();

  const isLoggedIn = !!req.auth?.user;

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
  // proxy.ts já roda no Node.js (exigido pelo jwt() que consulta o Prisma); `runtime` aqui gera erro.
};
