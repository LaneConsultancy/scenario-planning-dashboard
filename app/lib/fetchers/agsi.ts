import type { FetchResult } from "../types";

const AGSI_BASE = "https://agsi.gie.eu/api/data/eu";

export async function fetchGasStorage(): Promise<FetchResult> {
  const apiKey = process.env.AGSI_API_KEY;
  if (!apiKey) throw new Error("AGSI_API_KEY not set");

  const res = await fetch(AGSI_BASE, {
    headers: { "x-key": apiKey },
  });

  if (!res.ok) throw new Error(`AGSI API error: ${res.status}`);

  const data = await res.json();
  const latest = data[0];
  const fullPercent = parseFloat(latest.full);

  return {
    id: "gas-storage",
    currentValue: `${fullPercent.toFixed(1)}% full (EU average)`,
    numericValue: fullPercent,
    aiReasoning: null,
    source: "AGSI (Gas Infrastructure Europe)",
  };
}
