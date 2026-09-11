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
  // O callback jwt() consulta o banco (Prisma) para revalidar a sessão em
  // "sair de todos os dispositivos" — isso exige o runtime Node.js em vez do
  // Edge padrão, que não tem acesso ao driver do SQLite/Postgres.
  runtime: "nodejs",
};
