import type { FetchResult, GrokAssessment, Indicator } from "../types";
import { fetchGasStorage } from "./agsi";
import { fetchTTFGasPrice } from "./oilprice";
import { fetchFoodInflation } from "./ons";
import { fetchHouthiAttacks } from "./acled";
import { fetchHealthOutbreaks } from "./ukhsa";
import { fetchFertilizerPrice } from "./ahdb";
import { fetchHormuzTransit } from "./hormuz";
import { fetchGrokAssessments } from "./grok";

export interface FetchError {
  fetcherName: string;
  error: string;
}

async function safeFetch<T>(
  name: string,
  fn: () => Promise<T>,
  errors: FetchError[]
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[Fetcher:${name}] FAILED:`, message);
    errors.push({ fetcherName: name, error: message });
    return null;
  }
}

export async function fetchAllIndicators(previousIndicators: Indicator[] = []): Promise<{
  results: FetchResult[];
  grokAssessments: GrokAssessment[];
  errors: FetchError[];
}> {
  const errors: FetchError[] = [];

  const [gasStorage, gasPrice, foodInflation, houthiAttacks, healthOutbreaks, fertilizerPrice, hormuzTransit] =
    await Promise.all([
      safeFetch("agsi", fetchGasStorage, errors),
      safeFetch("oilprice", fetchTTFGasPrice, errors),
      safeFetch("ons", fetchFoodInflation, errors),
      safeFetch("acled", fetchHouthiAttacks, errors),
      safeFetch("ukhsa", fetchHealthOutbreaks, errors),
      safeFetch("ahdb", fetchFertilizerPrice, errors),
      safeFetch("hormuz", fetchHormuzTransit, errors),
    ]);

  const grokAssessments = await safeFetch("grok", () => fetchGrokAssessments(previousIndicators), errors);

  // Collect non-null results
  const results: FetchResult[] = [
    gasStorage,
    gasPrice,
    foodInflation,
    houthiAttacks,
    healthOutbreaks,
    fertilizerPrice,
    hormuzTransit,
  ].filter((r): r is FetchResult => r !== null);

  return { results, grokAssessments: grokAssessments ?? [], errors };
}
