import type { FetchResult } from "../types";

export async function fetchTTFGasPrice(): Promise<FetchResult> {
  return {
    id: "gas-price",
    currentValue: "Pending Grok AI assessment",
    numericValue: null,
    aiReasoning: null,
    source: "Grok AI (web search)",
  };
}
