import type { FetchResult } from "../types";

export async function fetchHouthiAttacks(): Promise<FetchResult> {
  return {
    id: "red-sea-houthi",
    currentValue: "Pending Grok AI assessment",
    numericValue: null,
    aiReasoning: null,
    source: "Grok AI (web search)",
  };
}

export async function fetchUKProtests(): Promise<{ count: number; formatted: string }> {
  return {
    count: 0,
    formatted: "Pending Grok AI assessment",
  };
}
