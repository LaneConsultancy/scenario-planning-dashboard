import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildGrokPrompt } from "@/app/lib/fetchers/grok";
import type { Indicator, Status } from "@/app/lib/types";

function makeIndicator(overrides: Partial<Indicator> & { id: string }): Indicator {
  return {
    category: "GEOPOLITICAL",
    name: "Test Indicator",
    status: "GREEN" as Status,
    currentValue: "No data",
    numericValue: null,
    threshold: "test",
    thresholdValue: null,
    thresholdDirection: "above",
    source: "test",
    lastUpdated: "2026-04-06T08:00:00.000Z",
    triggered: false,
    triggerDate: null,
    downgradeStreak: 0,
    aiReasoning: null,
    history: [],
    ...overrides,
  };
}

describe("buildGrokPrompt with previous indicators", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-07T08:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("includes previous assessment context for AI-assessed indicators", () => {
    const prev = [
      makeIndicator({
        id: "hormuz-transit",
        status: "RED",
        triggered: true,
        triggerDate: "2026-03-15T00:00:00.000Z",
        aiReasoning: "Transit at 5% of normal flow.",
      }),
    ];

    const prompt = buildGrokPrompt(prev);

    expect(prompt).toContain("PREVIOUS ASSESSMENT");
    expect(prompt).toContain("RED");
    expect(prompt).toContain("triggered since 2026-03-15");
    expect(prompt).toContain("Transit at 5% of normal flow.");
    expect(prompt).toContain("STATUS CHANGE RULES");
  });

  it("does not include context for indicators without previous data", () => {
    const prompt = buildGrokPrompt([]);

    expect(prompt).toContain('id: "hormuz-transit"');
    expect(prompt).not.toContain("PREVIOUS ASSESSMENT");
  });

  it("shows days since trigger for triggered indicators", () => {
    const prev = [
      makeIndicator({
        id: "uk-digital-id",
        status: "RED",
        triggered: true,
        triggerDate: "2026-04-04T00:00:00.000Z",
        aiReasoning: "Digital ID bill in committee.",
      }),
    ];

    const prompt = buildGrokPrompt(prev);

    expect(prompt).toContain("3 days");
  });

  it("shows status without trigger duration for non-triggered indicators", () => {
    const prev = [
      makeIndicator({
        id: "gas-price",
        status: "AMBER",
        triggered: false,
        aiReasoning: "TTF at 120p/therm, below trigger.",
      }),
    ];

    const prompt = buildGrokPrompt(prev);

    expect(prompt).toContain("AMBER");
    expect(prompt).toContain("TTF at 120p/therm");
    expect(prompt).not.toContain("triggered since");
  });
});
