import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const SESSION_COOKIE = "doma_session";

function sessionToken() {
  const password = process.env.DASHBOARD_PASSWORD ?? "";
  return createHash("sha256").update(`doma-baby:${password}`).digest("hex");
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/worker")) return NextResponse.next();
  if (pathname === "/login" || pathname.startsWith("/_next")) return NextResponse.next();

  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (cookie === sessionToken()) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
  runtime: "nodejs",
};
