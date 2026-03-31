import { describe, expect, it } from "vitest";
import { getDefinition } from "@/app/lib/indicators";
import { evaluateIndicatorDefinition } from "@/app/lib/indicator-evaluation";

describe("indicator-specific evaluation", () => {
  it("does not trigger gas storage before the deadline", () => {
    const definition = getDefinition("gas-storage");

    expect(
      evaluateIndicatorDefinition(
        definition,
        40,
        [],
        new Date("2026-03-27T12:00:00Z")
      )
    ).toEqual({ status: "GREEN", triggered: false });
  });

  it("triggers gas storage after the deadline if the threshold is missed", () => {
    const definition = getDefinition("gas-storage");

    expect(
      evaluateIndicatorDefinition(
        definition,
        40,
        [],
        new Date("2026-07-01T00:00:00Z")
      )
    ).toEqual({ status: "RED", triggered: true });
  });

  it("returns null for gas-price since it is now AI-assessed", () => {
    const definition = getDefinition("gas-price");

    expect(
      evaluateIndicatorDefinition(
        definition,
        160,
        [
          { value: 151, date: "2026-03-26T00:00:00Z" },
          { value: 152, date: "2026-03-26T06:00:00Z" },
        ],
        new Date("2026-03-27T00:00:00Z")
      )
    ).toBeNull();
  });

  it("marks reference metrics as non-triggering until exact rules are implemented", () => {
    const definition = getDefinition("health-emergency");

    expect(
      evaluateIndicatorDefinition(
        definition,
        500,
        [],
        new Date("2026-03-27T00:00:00Z")
      )
    ).toEqual({ status: "GREEN", triggered: false });
  });
});
