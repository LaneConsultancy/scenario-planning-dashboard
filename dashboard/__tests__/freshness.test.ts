import { describe, it, expect } from "vitest";
import {
  calculateFreshness,
  STALE_THRESHOLD_MS,
  SEVERELY_STALE_THRESHOLD_MS,
} from "@/app/lib/freshness";
import type { Indicator } from "@/app/lib/types";

const NOW = new Date("2026-06-10T12:00:00Z").getTime();

function makeIndicator(ageMs: number, overrides: Partial<Indicator> = {}): Indicator {
  return {
    id: "test",
    category: "ENERGY",
    name: "Test",
    status: "GREEN",
    currentValue: "50%",
    numericValue: 50,
    threshold: ">80%",
    thresholdValue: 80,
    thresholdDirection: "above",
    source: "test",
    lastUpdated: new Date(NOW - ageMs).toISOString(),
    triggered: false,
    triggerDate: null,
    downgradeStreak: 0,
    aiReasoning: null,
    history: [],
    ...overrides,
  };
}

describe("calculateFreshness", () => {
  it("reports 'fresh' when all indicators updated within a cycle", () => {
    const indicators = [makeIndicator(1000), makeIndicator(STALE_THRESHOLD_MS - 1)];
    const result = calculateFreshness(indicators, NOW);
    expect(result.level).toBe("fresh");
    expect(result.staleCount).toBe(0);
    expect(result.total).toBe(2);
  });

  it("reports 'degraded' when some but not all indicators are stale", () => {
    const indicators = [
      makeIndicator(1000),
      makeIndicator(STALE_THRESHOLD_MS + 1000),
    ];
    const result = calculateFreshness(indicators, NOW);
    expect(result.level).toBe("degraded");
    expect(result.staleCount).toBe(1);
  });

  it("reports 'stale' when every indicator is stale", () => {
    const indicators = [
      makeIndicator(STALE_THRESHOLD_MS + 1000),
      makeIndicator(STALE_THRESHOLD_MS + 2000),
    ];
    const result = calculateFreshness(indicators, NOW);
    expect(result.level).toBe("stale");
    expect(result.staleCount).toBe(2);
  });

  it("reports 'stale' when any indicator is severely stale, even if others are fresh", () => {
    const indicators = [
      makeIndicator(1000),
      makeIndicator(SEVERELY_STALE_THRESHOLD_MS + 1000),
    ];
    const result = calculateFreshness(indicators, NOW);
    expect(result.level).toBe("stale");
    expect(result.staleCount).toBe(1);
  });

  it("tracks the oldest indicator", () => {
    const oldest = makeIndicator(SEVERELY_STALE_THRESHOLD_MS + 5000);
    const indicators = [makeIndicator(1000), oldest];
    const result = calculateFreshness(indicators, NOW);
    expect(result.oldestUpdated).toBe(oldest.lastUpdated);
    expect(result.oldestAgeMs).toBe(SEVERELY_STALE_THRESHOLD_MS + 5000);
  });

  it("treats an empty dashboard as stale", () => {
    const result = calculateFreshness([], NOW);
    expect(result.level).toBe("stale");
    expect(result.total).toBe(0);
    expect(result.oldestUpdated).toBeNull();
  });
});
