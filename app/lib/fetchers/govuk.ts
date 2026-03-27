import type { FetchResult } from "../types";

const GOVUK_BASE = "https://www.gov.uk/api/search.json";

const ENERGY_KEYWORDS = ["energy security", "gas rationing", "energy emergency", "targeted measures", "contingency"];
const AGRICULTURE_KEYWORDS = ["food production", "food security", "crop failure", "farming crisis", "planting"];

async function searchGovUK(
  keywords: string[],
  organisation: string
): Promise<Array<{ title: string; link: string; public_timestamp: string }>> {
  const query = keywords.join(" OR ");
  const params = new URLSearchParams({
    q: query,
    filter_organisations: organisation,
    order: "-public_timestamp",
    count: "10",
  });

  const res = await fetch(`${GOVUK_BASE}?${params}`);
  if (!res.ok) throw new Error(`GOV.UK API error: ${res.status}`);

  const data = await res.json();
  return (data.results || []).map(
    (r: { title: string; link: string; public_timestamp: string }) => ({
      title: r.title,
      link: r.link,
      public_timestamp: r.public_timestamp,
    })
  );
}

export async function fetchDESNZStatements(): Promise<{
  results: Array<{ title: string; link: string; public_timestamp: string }>;
}> {
  const results = await searchGovUK(ENERGY_KEYWORDS, "department-for-energy-security-and-net-zero");
  return { results };
}

export async function fetchDefraStatements(): Promise<{
  results: Array<{ title: string; link: string; public_timestamp: string }>;
}> {
  const results = await searchGovUK(AGRICULTURE_KEYWORDS, "department-for-environment-food-rural-affairs");
  return { results };
}

// Unused export kept for type compatibility with the broader module surface
export type GovUKResult = FetchResult;
