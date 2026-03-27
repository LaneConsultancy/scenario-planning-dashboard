import type { FetchResult } from "../types";

const ACLED_BASE = "https://api.acleddata.com/acled/read";

export async function fetchHouthiAttacks(): Promise<FetchResult> {
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

  const res = await fetch(`${ACLED_BASE}?${params}`);
  if (!res.ok) throw new Error(`ACLED API error: ${res.status}`);

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

  const res = await fetch(`${ACLED_BASE}?${params}`);
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
