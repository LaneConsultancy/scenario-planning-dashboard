import type { FetchResult } from "../types";

const UKHSA_BASE = "https://api.ukhsa-dashboard.data.gov.uk";

export async function fetchHealthOutbreaks(): Promise<FetchResult> {
  const res = await fetch(
    `${UKHSA_BASE}/themes/infectious_disease/sub_themes/respiratory/topics/COVID-19/geography_types/Nation/geographies/England/metrics/COVID-19_cases_casesByDay`,
    { headers: { Accept: "application/json" } }
  );

  if (!res.ok) throw new Error(`UKHSA API error: ${res.status}`);

  const data = await res.json();
  const recentCases = data.results?.slice(0, 7) || [];
  const weeklyTotal = recentCases.reduce(
    (sum: number, d: { metric_value: number }) => sum + (d.metric_value || 0),
    0
  );

  return {
    id: "health-emergency",
    currentValue: `${weeklyTotal} England COVID cases (7-day total; reference metric only)`,
    numericValue: weeklyTotal,
    aiReasoning: null,
    source: "UKHSA Dashboard API",
  };
}
