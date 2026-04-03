import { describe, it, expect } from "vitest";
import {
  INDICATOR_DEFINITIONS,
  getDefinition,
  getDefinitionsByCategory,
} from "@/app/lib/indicators";

describe("INDICATOR_DEFINITIONS", () => {
  it("has exactly 15 indicators", () => {
    expect(INDICATOR_DEFINITIONS).toHaveLength(15);
  });

  it("has correct indicators per category", () => {
    expect(getDefinitionsByCategory("GEOPOLITICAL")).toHaveLength(3);
    expect(getDefinitionsByCategory("ENERGY")).toHaveLength(3);
    expect(getDefinitionsByCategory("AGRICULTURE")).toHaveLength(3);
    expect(getDefinitionsByCategory("POLITICAL")).toHaveLength(3);
    expect(getDefinitionsByCategory("CIVIL_LIBERTIES")).toHaveLength(3);
  });

  it("all indicators have unique ids", () => {
    const ids = INDICATOR_DEFINITIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getDefinition", () => {
  it("returns the correct definition", () => {
    const def = getDefinition("hormuz-transit");
    expect(def.name).toBe("Hormuz Transit Data");
    expect(def.category).toBe("GEOPOLITICAL");
  });

  it("throws for unknown id", () => {
    expect(() => getDefinition("nonexistent")).toThrow("Unknown indicator");
  });
});
