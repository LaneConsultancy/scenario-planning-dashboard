import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createDashboardSessionValue,
  DEFAULT_SESSION_MAX_AGE_SECONDS,
} from "@/app/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const correctPassword = process.env.DASHBOARD_PASSWORD;
  const authSecret = process.env.DASHBOARD_AUTH_SECRET;

  if (!correctPassword || !authSecret) {
    return NextResponse.json(
      { error: "Dashboard authentication not configured" },
      { status: 500 }
    );
  }

  if (password !== correctPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, createDashboardSessionValue(authSecret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DEFAULT_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
