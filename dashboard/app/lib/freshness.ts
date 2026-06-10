import type { Indicator } from "./types";

/**
 * Data freshness derived from the per-indicator `lastUpdated` timestamps.
 *
 * The header previously showed a hardcoded green dot and the pipeline's
 * `lastRefresh` (which is stamped "now" on every cron run regardless of
 * whether any fetch actually succeeded). That masks silent staleness: if the
 * cron stops firing or every fetcher fails, the header still looks healthy.
 *
 * This computes an honest signal from the data the user actually sees — each
 * indicator's `lastUpdated` — so a stalled pipeline surfaces at the top of the
 * page instead of only as per-indicator badges or an email.
 */

// One refresh cycle is 12h (cron `0 8,20 * * *`). An indicator that hasn't
// updated within a full cycle has missed a refresh — treat it as stale. This
// matches the per-indicator STALE badge threshold in IndicatorCard.
export const STALE_THRESHOLD_MS = 12 * 60 * 60 * 1000;
// Older than two cycles means the pipeline is almost certainly broken.
export const SEVERELY_STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export type FreshnessLevel = "fresh" | "degraded" | "stale";

export interface DataFreshness {
  level: FreshnessLevel;
  staleCount: number;
  total: number;
  oldestUpdated: string | null;
  oldestAgeMs: number | null;
}

export function calculateFreshness(
  indicators: Indicator[],
  now: number = Date.now()
): DataFreshness {
  const total = indicators.length;

  if (total === 0) {
    return { level: "stale", staleCount: 0, total: 0, oldestUpdated: null, oldestAgeMs: null };
  }

  let staleCount = 0;
  let oldestUpdated: string | null = null;
  let oldestAgeMs = 0;

  for (const indicator of indicators) {
    const age = now - new Date(indicator.lastUpdated).getTime();
    if (age > STALE_THRESHOLD_MS) staleCount++;
    if (age > oldestAgeMs) {
      oldestAgeMs = age;
      oldestUpdated = indicator.lastUpdated;
    }
  }

  let level: FreshnessLevel;
  if (staleCount === 0) {
    level = "fresh";
  } else if (staleCount === total || oldestAgeMs > SEVERELY_STALE_THRESHOLD_MS) {
    // Everything is stale, or something has gone two full cycles without an
    // update — the refresh pipeline is effectively down.
    level = "stale";
  } else {
    level = "degraded";
  }

  return { level, staleCount, total, oldestUpdated, oldestAgeMs };
}
