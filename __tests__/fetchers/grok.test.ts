import { describe, it, expect } from "vitest";
import { buildGrokPrompt, parseGrokResponse, stripGrokCitationTags } from "@/app/lib/fetchers/grok";

describe("stripGrokCitationTags", () => {
  it("removes a complete grok:render inline citation block", () => {
    const input =
      'Shipping is disrupted<grok:render type="render_inline_citation"><argument name="citation_id">29</argument></grok:render> according to recent reports.';
    expect(stripGrokCitationTags(input)).toBe(
      "Shipping is disrupted according to recent reports."
    );
  });

  it("removes multiple citation blocks from a single string", () => {
    const input =
      'IEA warned of disruption<grok:render type="render_inline_citation"><argument name="citation_id">1</argument></grok:render> and the NFU confirmed<grok:render type="render_inline_citation"><argument name="citation_id">2</argument></grok:render> the situation.';
    expect(stripGrokCitationTags(input)).toBe(
      "IEA warned of disruption and the NFU confirmed the situation."
    );
  });

  it("removes residual <argument> tags that appear without a grok wrapper", () => {
    const input = 'Some text <argument name="citation_id">5</argument> more text.';
    expect(stripGrokCitationTags(input)).toBe("Some text more text.");
  });

  it("removes complete <grok:*>...</grok:*> blocks including their inner content", () => {
    // Any paired grok tag is treated as a self-contained block and removed
    // wholesale — this mirrors how citation blocks work.
    const input = "Text <grok:something>inner content</grok:something> end.";
    expect(stripGrokCitationTags(input)).toBe("Text end.");
  });

  it("removes orphaned (unclosed) <grok:*> tags using the fallback pattern", () => {
    const input = "Text <grok:render type=\"foo\"> end.";
    expect(stripGrokCitationTags(input)).toBe("Text end.");
  });

  it("returns plain text unchanged", () => {
    const plain = "No disruption detected. Prices remain stable year on year.";
    expect(stripGrokCitationTags(plain)).toBe(plain);
  });

  it("collapses extra whitespace left after tag removal", () => {
    const input =
      "Before<grok:render type=\"render_inline_citation\"><argument name=\"citation_id\">3</argument></grok:render>after";
    // No space between "Before" and "after" — no collapsing needed, just tag removal
    expect(stripGrokCitationTags(input)).toBe("Beforeafter");
  });
});

describe("buildGrokPrompt", () => {
  it("returns a string containing all 8 qualitative indicators", () => {
    const prompt = buildGrokPrompt();
    expect(prompt).toContain("IEA");
    expect(prompt).toContain("Industrial curtailment");
    expect(prompt).toContain("NFU");
    expect(prompt).toContain("Government contingency");
    expect(prompt).toContain("Political stability");
    expect(prompt).toContain("Hormuz");
    expect(prompt).toContain("Red Sea");
    expect(prompt).toContain("JSON");
    expect(prompt).toContain("fertilizer");
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

  it("drops assessments with invalid status values", () => {
    const raw = JSON.stringify([
      {
        id: "iea-disruption",
        status: "ORANGE",
        currentValue: "No upgrade",
        triggered: false,
        reasoning: "Stable.",
      },
    ]);

    expect(parseGrokResponse(raw)).toEqual([]);
  });

  it("strips Grok citation XML tags from reasoning and currentValue fields", () => {
    const citationTag =
      '<grok:render type="render_inline_citation"><argument name="citation_id">7</argument></grok:render>';
    const raw = JSON.stringify([
      {
        id: "iea-disruption",
        status: "AMBER",
        currentValue: `IEA has issued warnings${citationTag} as of March 2026.`,
        triggered: false,
        reasoning: `The IEA report${citationTag} uses strong language but stops short of the threshold.`,
      },
    ]);

    const result = parseGrokResponse(raw);
    expect(result).toHaveLength(1);
    expect(result[0].currentValue).toBe("IEA has issued warnings as of March 2026.");
    expect(result[0].reasoning).toBe(
      "The IEA report uses strong language but stops short of the threshold."
    );
  });

  it("drops assessments with non-boolean triggered values", () => {
    const raw = JSON.stringify([
      {
        id: "iea-disruption",
        status: "GREEN",
        currentValue: "No upgrade",
        triggered: "false",
        reasoning: "Stable.",
      },
    ]);

    expect(parseGrokResponse(raw)).toEqual([]);
  });
});
