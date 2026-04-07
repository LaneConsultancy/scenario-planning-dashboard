import type { FetchResult } from "../types";

export async function fetchHormuzTransit(): Promise<FetchResult> {
  return {
    id: "hormuz-transit",
    currentValue: "Pending Grok AI assessment",
    numericValue: null,
    aiReasoning: null,
    source: "WTO Hormuz Trade Tracker + Grok AI",
  };
}
