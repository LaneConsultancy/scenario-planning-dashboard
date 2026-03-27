import type { FetchResult } from "../types";

export async function fetchFoodInflation(): Promise<FetchResult> {
  const res = await fetch(
    "https://api.beta.ons.gov.uk/v1/timeseries/d7g7/dataset/mm23/data",
    { headers: { Accept: "application/json" } }
  );

  if (!res.ok) throw new Error(`ONS API error: ${res.status}`);

  const data = await res.json();
  const months = data.months;
  const latest = months[months.length - 1];
  const rate = parseFloat(latest.value);

  return {
    id: "food-inflation",
    currentValue: `${rate.toFixed(1)}% annual food CPI (${latest.date})`,
    numericValue: rate,
    aiReasoning: null,
    source: "ONS (CPI food & non-alcoholic beverages)",
  };
}
