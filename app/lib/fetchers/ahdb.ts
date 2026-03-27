import type { FetchResult } from "../types";

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";
const FRED_SERIES = "PCU325311325311A";

export async function fetchFertilizerPrice(): Promise<FetchResult> {
  const params = new URLSearchParams({
    series_id: FRED_SERIES,
    api_key: process.env.FRED_API_KEY || "DEMO_KEY",
    file_type: "json",
    sort_order: "desc",
    limit: "13",
  });

  const res = await fetch(`${FRED_BASE}?${params}`);

  if (!res.ok) {
    return {
      id: "fertilizer-price",
      currentValue: "Unable to fetch fertilizer data",
      numericValue: null,
      aiReasoning: null,
      source: "FRED API (fallback)",
    };
  }

  const data = await res.json();
  const observations = data.observations || [];

  if (observations.length < 2) {
    return {
      id: "fertilizer-price",
      currentValue: "Insufficient data",
      numericValue: null,
      aiReasoning: null,
      source: "FRED API",
    };
  }

  const latest = parseFloat(observations[0].value);
  const yearAgo = parseFloat(observations[observations.length - 1].value);
  const yoyChange = ((latest - yearAgo) / yearAgo) * 100;

  return {
    id: "fertilizer-price",
    currentValue: `${yoyChange >= 0 ? "+" : ""}${yoyChange.toFixed(1)}% YoY (PPI index: ${latest.toFixed(1)})`,
    numericValue: yoyChange,
    aiReasoning: null,
    source: "FRED API (US Nitrogenous Fertilizer PPI as proxy)",
  };
}
