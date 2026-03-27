import type { FetchResult } from "../types";

const OILPRICE_BASE = "https://api.oilpriceapi.com/v1/prices/latest";

async function fetchPrice(code: string): Promise<{ price: number; currency: string }> {
  const apiKey = process.env.OILPRICE_API_KEY;
  if (!apiKey) throw new Error("OILPRICE_API_KEY not set");

  const res = await fetch(`${OILPRICE_BASE}?by_code=${code}`, {
    headers: { Authorization: `Token ${apiKey}` },
  });

  if (!res.ok) throw new Error(`OilPriceAPI error: ${res.status}`);

  const data = await res.json();
  return { price: data.data.price, currency: data.data.currency };
}

export async function fetchTTFGasPrice(): Promise<FetchResult> {
  const { price } = await fetchPrice("DUTCH_TTF_EUR");
  const pencePerTherm = price * 0.02931 * 0.86 * 100;

  return {
    id: "gas-price",
    currentValue: `TTF: ${pencePerTherm.toFixed(0)}p/therm (€${price.toFixed(2)}/MWh)`,
    numericValue: pencePerTherm,
    aiReasoning: null,
    source: "OilPriceAPI (Dutch TTF)",
  };
}

export async function fetchBrentCrude(): Promise<{ price: number; formatted: string }> {
  const { price } = await fetchPrice("BRENT_CRUDE_USD");
  return { price, formatted: `$${price.toFixed(2)}/bbl` };
}
