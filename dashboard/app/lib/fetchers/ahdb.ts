import type { FetchResult } from "../types";

export async function fetchFertilizerPrice(): Promise<FetchResult> {
  return {
    id: "fertilizer-price",
    currentValue: "Pending Grok AI assessment",
    numericValue: null,
    aiReasoning: null,
    source: "AHDB + Grok AI (web search)",
  };
}
