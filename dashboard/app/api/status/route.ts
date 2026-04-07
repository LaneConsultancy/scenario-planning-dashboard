import { NextResponse } from "next/server";
import { getDashboardState } from "@/app/lib/kv";

export async function GET() {
  const state = await getDashboardState();
  if (!state) {
    return NextResponse.json({ error: "No data available" }, { status: 404 });
  }
  return NextResponse.json(state);
}
