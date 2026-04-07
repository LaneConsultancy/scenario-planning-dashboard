import type { FetchResult } from "../types";

/**
 * ONS Beta API — the old v0 "/v1/timeseries/{cdid}/dataset/{dataset}/data"
 * endpoint was retired and now returns 404.
 *
 * Working endpoint (verified March 2026):
 *   GET https://api.beta.ons.gov.uk/v1/data?uri=/economy/inflationandpriceindices/timeseries/{cdid}/mm23
 *
 * No authentication required. Rate limit: 120 req / 10s, 200 req / min.
 *
 * Note: The original code used D7G7 which is CPI ALL ITEMS (not food).
 * The correct series for food & non-alcoholic beverages annual rate is D7G8.
 *
 * Response format:
 * {
 *   years:    [{ date, value, label, year, sourceDataset, updateDate }, ...],
 *   quarters: [{ date, value, label, year, quarter, sourceDataset, updateDate }, ...],
 *   months:   [{ date, value, label, year, month, sourceDataset, updateDate }, ...],
 *   relatedDatasets: [...],
 *   ...
 * }
 */

const ONS_FOOD_CPI_URL =
  "https://api.beta.ons.gov.uk/v1/data?uri=/economy/inflationandpriceindices/timeseries/d7g8/mm23";

export async function fetchFoodInflation(): Promise<FetchResult> {
  const res = await fetch(ONS_FOOD_CPI_URL, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`ONS API error: ${res.status}`);

  const data = await res.json();
  const months = data.months;
  const latest = months[months.length - 1];
  const rate = parseFloat(latest.value);

  return {
    id: "food-inflation",
    currentValue: `${rate.toFixed(1)}% annual food CPI (${latest.date}; reference metric only)`,
    numericValue: rate,
    aiReasoning: null,
    source: "ONS (CPI food & non-alcoholic beverages)",
  };
}
