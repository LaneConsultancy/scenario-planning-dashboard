import type { FetchResult, GrokAssessment } from "../types";
import { fetchGasStorage } from "./agsi";
import { fetchTTFGasPrice } from "./oilprice";
import { fetchFoodInflation } from "./ons";
import { fetchHouthiAttacks } from "./acled";
import { fetchHealthOutbreaks } from "./ukhsa";
import { fetchFertilizerPrice } from "./ahdb";
import { fetchHormuzTransit } from "./hormuz";
import { fetchGrokAssessments } from "./grok";

async function safeFetch<T>(
  name: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[Fetcher:${name}] Error:`, error);
    return fallback;
  }
}

const EMPTY_RESULT = (id: string): FetchResult => ({
  id,
  currentValue: "Data unavailable",
  numericValue: null,
  aiReasoning: null,
  source: "Error fetching data",
});

export async function fetchAllIndicators(): Promise<{
  results: FetchResult[];
  grokAssessments: GrokAssessment[];
}> {
  const [gasStorage, gasPrice, foodInflation, houthiAttacks, healthOutbreaks, fertilizerPrice, hormuzTransit] =
    await Promise.all([
      safeFetch("agsi", fetchGasStorage, EMPTY_RESULT("gas-storage")),
      safeFetch("oilprice", fetchTTFGasPrice, EMPTY_RESULT("gas-price")),
      safeFetch("ons", fetchFoodInflation, EMPTY_RESULT("food-inflation")),
      safeFetch("acled", fetchHouthiAttacks, EMPTY_RESULT("red-sea-houthi")),
      safeFetch("ukhsa", fetchHealthOutbreaks, EMPTY_RESULT("health-emergency")),
      safeFetch("ahdb", fetchFertilizerPrice, EMPTY_RESULT("fertilizer-price")),
      safeFetch("hormuz", fetchHormuzTransit, EMPTY_RESULT("hormuz-transit")),
    ]);

  const grokAssessments = await safeFetch("grok", fetchGrokAssessments, []);

  const results: FetchResult[] = [
    gasStorage,
    gasPrice,
    foodInflation,
    houthiAttacks,
    healthOutbreaks,
    fertilizerPrice,
    hormuzTransit,
  ];

  return { results, grokAssessments };
}
