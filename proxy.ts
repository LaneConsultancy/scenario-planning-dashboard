import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyDashboardSessionValue } from "@/app/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname === "/api/auth") {
    return NextResponse.next();
  }

  if (pathname === "/api/cron/refresh") {
    return NextResponse.next();
  }

  const authSecret = process.env.DASHBOARD_AUTH_SECRET;
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

  if (verifyDashboardSessionValue(authCookie?.value, authSecret)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
