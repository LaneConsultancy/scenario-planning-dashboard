import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/app/lib/auth";
import { getDashboardState } from "@/app/lib/kv";
import { sendMissedRefreshEmail } from "@/app/lib/email";

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!isAuthorizedCronRequest(authHeader, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getDashboardState();
  if (!state) {
    return NextResponse.json({ status: "no-data", message: "No dashboard state found" });
  }

  const lastRefreshAge = Date.now() - new Date(state.lastRefresh).getTime();
  const isStale = lastRefreshAge > STALE_THRESHOLD_MS;

  if (isStale) {
    await sendMissedRefreshEmail(state.lastRefresh, lastRefreshAge);
    return NextResponse.json({ status: "stale", lastRefresh: state.lastRefresh, ageHours: Math.round(lastRefreshAge / 3600000) });
  }

  return NextResponse.json({ status: "healthy", lastRefresh: state.lastRefresh, ageHours: Math.round(lastRefreshAge / 3600000) });
}
