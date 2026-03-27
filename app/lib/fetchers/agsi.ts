import type { FetchResult } from "../types";

/**
 * AGSI (Gas Infrastructure Europe) API
 *
 * Base URL: https://agsi.gie.eu/api
 * Auth: "x-key" header with API key from https://agsi.gie.eu/account
 *
 * For EU aggregate data, use query param: type=EU
 * (For individual countries, use: country=DE, country=FR, etc.)
 *
 * The old endpoint "/api/data/eu" does NOT exist. The correct path is just "/api"
 * with query parameters.
 *
 * Response format (paginated):
 * {
 *   data: [
 *     {
 *       gasDayStart: "2026-03-26",    // start of gas day
 *       gasInStorage: "755123.45",     // total gas in storage (GWh)
 *       full: "58.23",                 // <-- fill percentage (this is what we need)
 *       trend: "0.12",                 // daily change in fill %
 *       injection: "1234.56",          // injection volume (GWh)
 *       withdrawal: "567.89",          // withdrawal volume (GWh)
 *       workingGasVolume: "1296789.00",// total working gas volume (GWh)
 *       injectionCapacity: "...",
 *       withdrawalCapacity: "...",
 *       status: "E",                   // E = estimated, C = confirmed, N = no data
 *       trend: "...",
 *       consumption: "...",
 *       consumptionFull: "...",
 *       name: "EU",
 *       code: "EU",
 *       url: "...",
 *       updatedAt: "2026-03-27T19:30:00Z",
 *       info: "..."
 *     },
 *     ... (more days, default 30 per page, max 300 with size param)
 *   ],
 *   last_page: 1
 * }
 *
 * Data is updated daily at 19:30 CET and again at 23:00 CET.
 */

const AGSI_BASE = "https://agsi.gie.eu/api";

export async function fetchGasStorage(): Promise<FetchResult> {
  const apiKey = process.env.AGSI_API_KEY;
  if (!apiKey) throw new Error("AGSI_API_KEY not set");

  const params = new URLSearchParams({
    type: "EU",
    size: "1",
  });

  const res = await fetch(`${AGSI_BASE}?${params}`, {
    headers: { "x-key": apiKey },
  });

  if (!res.ok) throw new Error(`AGSI API error: ${res.status}`);

  const json = await res.json();

  // Response is { data: [...], last_page: N } — NOT a bare array
  const entries = json.data;
  if (!entries || entries.length === 0) {
    throw new Error("AGSI API returned no data entries");
  }

  const latest = entries[0];
  const fullPercent = parseFloat(latest.full);

  if (isNaN(fullPercent)) {
    throw new Error(
      `AGSI: unexpected 'full' value: ${JSON.stringify(latest.full)} ` +
      `(status: ${latest.status}, gasDayStart: ${latest.gasDayStart})`
    );
  }

  return {
    id: "gas-storage",
    currentValue: `${fullPercent.toFixed(1)}% full (EU average, ${latest.gasDayStart})`,
    numericValue: fullPercent,
    aiReasoning: null,
    source: "AGSI (Gas Infrastructure Europe)",
  };
}
