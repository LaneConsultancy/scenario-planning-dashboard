import { describe, it, expect } from "vitest";
import { buildGrokPrompt, parseGrokResponse } from "@/app/lib/fetchers/grok";

describe("buildGrokPrompt", () => {
  it("returns a string containing all 7 qualitative indicators", () => {
    const prompt = buildGrokPrompt();
    expect(prompt).toContain("IEA");
    expect(prompt).toContain("Industrial curtailment");
    expect(prompt).toContain("NFU");
    expect(prompt).toContain("Government contingency");
    expect(prompt).toContain("Political stability");
    expect(prompt).toContain("Hormuz");
    expect(prompt).toContain("Red Sea");
    expect(prompt).toContain("JSON");
  });
});

describe("parseGrokResponse", () => {
  it("parses valid JSON response into GrokAssessment array", () => {
    const raw = JSON.stringify([
      {
        id: "iea-disruption",
        status: "AMBER",
        currentValue: "IEA has warned of 'significant disruption' but not yet 'largest'",
        triggered: false,
        reasoning: "IEA March 2026 report uses strong language but stops short of the specific threshold.",
      },
      {
        id: "industrial-curtailment",
        status: "GREEN",
        currentValue: "1 major plant (CF Fertilisers) curtailed",
        triggered: false,
        reasoning: "Only one confirmed curtailment so far, below the >3 threshold.",
      },
    ]);

    const result = parseGrokResponse(raw);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("iea-disruption");
    expect(result[0].status).toBe("AMBER");
    expect(result[0].triggered).toBe(false);
  });

  it("returns empty array for invalid JSON", () => {
    const result = parseGrokResponse("not json at all");
    expect(result).toEqual([]);
  });

  it("extracts JSON from markdown code blocks", () => {
    const raw = '```json\n[{"id":"iea-disruption","status":"GREEN","currentValue":"No upgrade","triggered":false,"reasoning":"Stable."}]\n```';
    const result = parseGrokResponse(raw);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("iea-disruption");
  });
});
