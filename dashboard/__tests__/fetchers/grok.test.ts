import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildGrokPrompt,
  parseGrokResponse,
  stripGrokCitationTags,
  fetchGrokAssessments,
  EXPECTED_GROK_IDS,
  type GrokClient,
} from "@/app/lib/fetchers/grok";
import type { GrokAssessment } from "@/app/lib/types";

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

  it("removes bracket-style [web:N] citations", () => {
    const input = "Traffic reported as frozen.[web:36][web:38] Prediction markets show low probability.[web:31]";
    expect(stripGrokCitationTags(input)).toBe(
      "Traffic reported as frozen. Prediction markets show low probability."
    );
  });

  it("removes bracket-style [post:N] and [x:N] citations", () => {
    const input = "Russia poised to terminate gas sales.[post:78][post:80][web:107]";
    expect(stripGrokCitationTags(input)).toBe("Russia poised to terminate gas sales.");
  });

  it("removes mixed XML and bracket citations", () => {
    const input =
      'IEA warned<grok:render type="render_inline_citation"><argument name="citation_id">1</argument></grok:render> of disruption.[web:41][web:42]';
    expect(stripGrokCitationTags(input)).toBe("IEA warned of disruption.");
  });
});

describe("buildGrokPrompt", () => {
  it("returns a string containing all 9 Grok-assessed indicators", () => {
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
    expect(prompt).toContain("gas-price");
    expect(prompt).toContain("TTF");
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

function makeAssessment(id: string): GrokAssessment {
  return {
    id,
    status: "GREEN",
    currentValue: `Current value for ${id}`,
    triggered: false,
    reasoning: `Reasoning for ${id}.`,
  };
}

function makeFullResponse(): GrokAssessment[] {
  return EXPECTED_GROK_IDS.map((id) => makeAssessment(id));
}

function makeMockClient(responses: GrokAssessment[][]): {
  client: GrokClient;
  prompts: string[];
} {
  const prompts: string[] = [];
  let callIndex = 0;
  const client: GrokClient = {
    chat: {
      completions: {
        create: async (args) => {
          prompts.push(args.messages[0].content);
          const next = responses[callIndex] ?? [];
          callIndex += 1;
          return {
            choices: [{ message: { content: JSON.stringify(next) } }],
          };
        },
      },
    },
  };
  return { client, prompts };
}

describe("fetchGrokAssessments self-healing", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("returns all assessments without retry when first call is complete", async () => {
    const { client, prompts } = makeMockClient([makeFullResponse()]);

    const result = await fetchGrokAssessments([], client);

    expect(result).toHaveLength(EXPECTED_GROK_IDS.length);
    expect(prompts).toHaveLength(1);
    // First-pass prompt covers every expected indicator
    for (const id of EXPECTED_GROK_IDS) {
      expect(prompts[0]).toContain(`id: "${id}"`);
    }
  });

  it("retries with only the missing indicators when first call is partial", async () => {
    const full = makeFullResponse();
    const missingIds = ["fertilizer-price", "gas-price"];
    const partial = full.filter((a) => !missingIds.includes(a.id));
    const recovered = missingIds.map((id) => makeAssessment(id));

    const { client, prompts } = makeMockClient([partial, recovered]);

    const result = await fetchGrokAssessments([], client);

    expect(result).toHaveLength(EXPECTED_GROK_IDS.length);
    expect(new Set(result.map((a) => a.id))).toEqual(new Set(EXPECTED_GROK_IDS));
    // Retry prompt contains the missing IDs but not the ones we already have
    expect(prompts).toHaveLength(2);
    for (const id of missingIds) {
      expect(prompts[1]).toContain(`id: "${id}"`);
    }
    expect(prompts[1]).not.toContain('id: "iea-disruption"');
  });

  it("throws when indicators are still missing after the retry", async () => {
    const partial = makeFullResponse().filter((a) => a.id !== "hormuz-transit");
    // Retry returns nothing — Grok keeps failing on hormuz-transit
    const { client, prompts } = makeMockClient([partial, []]);

    await expect(fetchGrokAssessments([], client)).rejects.toThrow(/hormuz-transit/);
    expect(prompts).toHaveLength(2);
  });

  it("retries with the full set when the first call returns nothing", async () => {
    const { client, prompts } = makeMockClient([[], makeFullResponse()]);

    const result = await fetchGrokAssessments([], client);

    expect(result).toHaveLength(EXPECTED_GROK_IDS.length);
    expect(prompts).toHaveLength(2);
    // Retry prompt asks for every expected id because all are missing
    for (const id of EXPECTED_GROK_IDS) {
      expect(prompts[1]).toContain(`id: "${id}"`);
    }
  });

  it("throws after retry when the first call returns invalid JSON", async () => {
    const malformedClient: GrokClient = {
      chat: {
        completions: {
          create: vi
            .fn()
            // first call: garbage content → parseGrokResponse returns []
            .mockResolvedValueOnce({
              choices: [{ message: { content: "not json at all" } }],
            })
            // retry: also nothing
            .mockResolvedValueOnce({
              choices: [{ message: { content: "" } }],
            }),
        },
      },
    };

    await expect(fetchGrokAssessments([], malformedClient)).rejects.toThrow(
      /after retry/
    );
  });

  it("ignores duplicate ids returned in the retry", async () => {
    const full = makeFullResponse();
    const partial = full.slice(0, 11); // drops the last one
    const missingId = full[11].id;
    // Retry returns the missing one PLUS a duplicate of one we already had
    const retryWithDupe = [makeAssessment(missingId), full[0]];

    const { client } = makeMockClient([partial, retryWithDupe]);

    const result = await fetchGrokAssessments([], client);

    expect(result).toHaveLength(EXPECTED_GROK_IDS.length);
    // The first-pass version of full[0] wins; we don't pick up the duplicate
    const firstId = result.filter((a) => a.id === full[0].id);
    expect(firstId).toHaveLength(1);
  });
});
