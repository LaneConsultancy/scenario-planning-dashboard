import type { FetchResult } from "../types";

/**
 * ACLED API — as of 2025, requires OAuth authentication.
 *
 * Auth flow:
 *   1. POST https://acleddata.com/oauth/token  (grant_type=password, client_id=acled)
 *   2. Receive { access_token, refresh_token, token_type, expires_in }
 *   3. Use "Authorization: Bearer <access_token>" on data requests
 *
 * Data endpoint: https://acleddata.com/api/acled/read
 * (Old domain "api.acleddata.com" no longer works — moved to acleddata.com/api/)
 *
 * Env vars required:
 *   ACLED_EMAIL    — myACLED account email
 *   ACLED_PASSWORD — myACLED account password
 */

const ACLED_TOKEN_URL = "https://acleddata.com/oauth/token";
const ACLED_BASE = "https://acleddata.com/api/acled/read";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAcledToken(): Promise<string> {
  // Return cached token if still valid (with 5-min buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const email = process.env.ACLED_EMAIL;
  const password = process.env.ACLED_PASSWORD;
  if (!email || !password) {
    throw new Error("ACLED_EMAIL and ACLED_PASSWORD env vars required");
  }

  const res = await fetch(ACLED_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      username: email,
      password: password,
      grant_type: "password",
      client_id: "acled",
    }),
  });

  if (!res.ok) {
    throw new Error(`ACLED OAuth error: ${res.status} ${await res.text()}`);
  }

  const auth = await res.json();
  // auth = { access_token, refresh_token, token_type: "Bearer", expires_in: 86400 }
  cachedToken = {
    token: auth.access_token,
    expiresAt: Date.now() + auth.expires_in * 1000,
  };

  return cachedToken.token;
}

export async function fetchHouthiAttacks(): Promise<FetchResult> {
  const token = await getAcledToken();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const params = new URLSearchParams({
    event_date: `${thirtyDaysAgo}|${new Date().toISOString().split("T")[0]}`,
    event_date_where: "BETWEEN",
    region: "11",
    sub_event_type: "Shelling/artillery/missile attack",
    limit: "100",
  });

  const res = await fetch(`${ACLED_BASE}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`ACLED API error: ${res.status}`);

  // Response: { status: 200, success: true, data: [...], count: N }
  const data = await res.json();
  const houthiEvents = (data.data || []).filter(
    (e: { actor1: string; notes: string }) =>
      e.actor1?.toLowerCase().includes("houthi") ||
      e.notes?.toLowerCase().includes("red sea") ||
      e.notes?.toLowerCase().includes("shipping")
  );

  const count = houthiEvents.length;

  return {
    id: "red-sea-houthi",
    currentValue: `${count} Houthi/Red Sea attacks in last 30 days`,
    numericValue: count,
    aiReasoning: null,
    source: "ACLED (Armed Conflict Location & Event Data)",
  };
}

export async function fetchUKProtests(): Promise<{ count: number; formatted: string }> {
  const token = await getAcledToken();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const params = new URLSearchParams({
    event_date: `${thirtyDaysAgo}|${new Date().toISOString().split("T")[0]}`,
    event_date_where: "BETWEEN",
    country: "United Kingdom",
    event_type: "Protests",
    limit: "500",
  });

  const res = await fetch(`${ACLED_BASE}?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`ACLED API error: ${res.status}`);

  const data = await res.json();
  const costOfLiving = (data.data || []).filter(
    (e: { notes: string }) =>
      e.notes?.toLowerCase().includes("cost of living") ||
      e.notes?.toLowerCase().includes("energy") ||
      e.notes?.toLowerCase().includes("fuel")
  );

  return {
    count: costOfLiving.length,
    formatted: `${costOfLiving.length} cost-of-living protests in last 30 days`,
  };
}
