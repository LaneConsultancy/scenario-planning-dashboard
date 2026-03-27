import { describe, it, expect } from "vitest";
import {
  evaluateIndicatorStatus,
  calculateCategoryStatus,
  calculateOverallStatus,
} from "@/app/lib/traffic-light";
import type { Indicator } from "@/app/lib/types";

function makeIndicator(overrides: Partial<Indicator> = {}): Indicator {
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
    lastUpdated: new Date().toISOString(),
    triggered: false,
    triggerDate: null,
    aiReasoning: null,
    history: [],
    ...overrides,
  };
}

describe("evaluateIndicatorStatus", () => {
  it("returns GREEN when value is safely within threshold (above direction)", () => {
    const result = evaluateIndicatorStatus(30, 80, "above", 0.8);
    expect(result).toEqual({ status: "GREEN", triggered: false });
  });

  it("returns AMBER when value is within 80% of threshold (above direction)", () => {
    const result = evaluateIndicatorStatus(65, 80, "above", 0.8);
    expect(result).toEqual({ status: "AMBER", triggered: false });
  });

  it("returns RED when value exceeds threshold (above direction)", () => {
    const result = evaluateIndicatorStatus(85, 80, "above", 0.8);
    expect(result).toEqual({ status: "RED", triggered: true });
  });

  it("returns GREEN when value is safely above threshold (below direction)", () => {
    const result = evaluateIndicatorStatus(70, 50, "below", 0.8);
    expect(result).toEqual({ status: "GREEN", triggered: false });
  });

  it("returns AMBER when value approaches threshold from above (below direction)", () => {
    const result = evaluateIndicatorStatus(58, 50, "below", 0.8);
    expect(result).toEqual({ status: "AMBER", triggered: false });
  });

  it("returns RED when value drops below threshold (below direction)", () => {
    const result = evaluateIndicatorStatus(45, 50, "below", 0.8);
    expect(result).toEqual({ status: "RED", triggered: true });
  });

  it("returns null for null numeric value", () => {
    const result = evaluateIndicatorStatus(null, null, "above", 0.8);
    expect(result).toBeNull();
  });
});

describe("calculateCategoryStatus", () => {
  it("returns GREEN when no indicators triggered", () => {
    const indicators = [
      makeIndicator({ status: "GREEN", triggered: false }),
      makeIndicator({ status: "GREEN", triggered: false }),
    ];
    expect(calculateCategoryStatus(indicators)).toEqual({
      status: "GREEN",
      triggeredCount: 0,
      total: 2,
    });
  });

  it("returns RED when any indicator is RED", () => {
    const indicators = [
      makeIndicator({ status: "GREEN", triggered: false }),
      makeIndicator({ status: "RED", triggered: true }),
    ];
    expect(calculateCategoryStatus(indicators)).toEqual({
      status: "RED",
      triggeredCount: 1,
      total: 2,
    });
  });

  it("returns AMBER when worst is AMBER", () => {
    const indicators = [
      makeIndicator({ status: "GREEN", triggered: false }),
      makeIndicator({ status: "AMBER", triggered: false }),
    ];
    expect(calculateCategoryStatus(indicators)).toEqual({
      status: "AMBER",
      triggeredCount: 0,
      total: 2,
    });
  });
});

describe("calculateOverallStatus", () => {
  it("returns GREEN for 0-1 triggered", () => {
    expect(calculateOverallStatus(0)).toBe("GREEN");
    expect(calculateOverallStatus(1)).toBe("GREEN");
  });

  it("returns AMBER for 2-3 triggered", () => {
    expect(calculateOverallStatus(2)).toBe("AMBER");
    expect(calculateOverallStatus(3)).toBe("AMBER");
  });

  it("returns RED for 4+ triggered", () => {
    expect(calculateOverallStatus(4)).toBe("RED");
    expect(calculateOverallStatus(8)).toBe("RED");
  });
});
