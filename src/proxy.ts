import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = new Set(["/login", "/register"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession =
    request.cookies.has("medexchange_session") ||
    request.cookies.has("accessToken");

  if (PUBLIC_ROUTES.has(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!PUBLIC_ROUTES.has(pathname) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
