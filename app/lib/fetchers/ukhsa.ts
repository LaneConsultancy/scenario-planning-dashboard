import type { FetchResult } from "../types";

const UKHSA_BASE = "https://api.ukhsa-dashboard.data.gov.uk";

export async function fetchHealthOutbreaks(): Promise<FetchResult> {
  const res = await fetch(
    `${UKHSA_BASE}/themes/infectious_disease/sub_themes/respiratory/topics/COVID-19/geography_types/Nation/geographies/England/metrics/COVID-19_cases_casesByDay`,
    { headers: { Accept: "application/json" } }
  );

  let outbreakCount = 0;
  let description = "No elevated outbreak activity detected";

  if (res.ok) {
    const data = await res.json();
    const recentCases = data.results?.slice(0, 7) || [];
    const weeklyTotal = recentCases.reduce(
      (sum: number, d: { metric_value: number }) => sum + (d.metric_value || 0),
      0
    );
    outbreakCount = weeklyTotal;
    description = `${weeklyTotal} cases (7-day total, latest available)`;
  }

  return {
    id: "health-emergency",
    currentValue: description,
    numericValue: outbreakCount,
    aiReasoning: null,
    source: "UKHSA Dashboard API",
  };
}
