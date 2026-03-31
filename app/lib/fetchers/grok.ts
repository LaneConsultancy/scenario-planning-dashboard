import OpenAI from "openai";
import type { GrokAssessment, Status } from "../types";

const GROK_MODEL = "x-ai/grok-4.1-fast";
const VALID_GROK_IDS = new Set([
  "iea-disruption",
  "industrial-curtailment",
  "nfu-warnings",
  "govt-contingency",
  "political-stability",
  "hormuz-transit",
  "red-sea-houthi",
  "fertilizer-price",
  "gas-price",
]);
const VALID_STATUSES = new Set<Status>(["GREEN", "AMBER", "RED"]);

function isValidGrokAssessment(item: unknown): item is GrokAssessment {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    VALID_GROK_IDS.has(candidate.id) &&
    typeof candidate.status === "string" &&
    VALID_STATUSES.has(candidate.status as Status) &&
    typeof candidate.currentValue === "string" &&
    typeof candidate.triggered === "boolean" &&
    typeof candidate.reasoning === "string"
  );
}

export function buildGrokPrompt(): string {
  return `You are a UK crisis monitoring system. Assess the following indicators using current web, news, and X/Twitter data. Today's date is ${new Date().toISOString().split("T")[0]}.

For EACH indicator, return a JSON object with these exact fields:
- id (string): the indicator ID exactly as given
- status ("GREEN" | "AMBER" | "RED"): your assessment
- currentValue (string): brief factual summary of current state
- triggered (boolean): has the threshold been crossed?
- reasoning (string): 1-2 sentence explanation citing specific sources

Return a JSON array of objects. No markdown, no explanation outside the JSON.

Indicators to assess:

1. id: "iea-disruption" — Has the IEA upgraded its assessment to "largest disruption in history"? Is there a de-escalation roadmap? Threshold: IEA uses that specific language with no de-escalation by July 2026.

2. id: "industrial-curtailment" — Industrial curtailment check: How many major UK chemical, steel, or fertilizer plants have announced gas-related force majeure or curtailment? Threshold: >3 plants.

3. id: "nfu-warnings" — Has the NFU or Defra issued a formal "food production at risk" statement? Are >20% of arable farmers reporting reduced planting? Check NFU press releases and Defra publications.

4. id: "govt-contingency" — Government contingency check: Has any UK minister or DESNZ made statements about "targeted measures," called an emergency summit, or announced subsidy caps related to energy? Look for language shift from denial to contingency planning.

5. id: "political-stability" — Political stability check: Has Labour lost >2 by-elections since January 2026? Have cost-of-living protests turned violent or widespread? Check recent UK political news.

6. id: "hormuz-transit" — What is the current status of shipping through the Strait of Hormuz? What percentage of normal traffic is flowing? Is there any firm reopening date or diplomatic progress? Threshold: <10% of normal traffic.

7. id: "red-sea-houthi" — Are there ongoing Houthi attacks on shipping (>2/month)? Has Russia threatened or cut pipeline gas to Europe? Check latest Red Sea maritime security updates.

8. id: "fertilizer-price" — What are current UK fertilizer prices (ammonium nitrate, urea) and how do they compare to a year ago? Search for: UK fertilizer price trends 2026, AHDB fertilizer market, CF Fertilisers UK pricing, British Survey of Fertiliser Practice, Profercy nitrogen index. Also check UK red diesel prices (current pence per litre). Threshold: fertilizer >+40% YoY increase OR red diesel >110 pence per litre. If exact AHDB figures aren't available, use industry reports, farmer forums, or news articles about UK fertilizer costs.

9. id: "gas-price" — What is the current Dutch TTF natural gas spot price in EUR/MWh? Convert to UK pence per therm (multiply EUR/MWh by 0.02931 × GBP/EUR rate × 100, or approximate: EUR/MWh × 2.52 ≈ pence/therm at current exchange rates). Search for: TTF gas price today, Dutch TTF spot price, European gas prices. Also check the Ofgem energy price cap — is it above £1,900/year? Threshold: TTF >150 pence/therm sustained OR Ofgem cap >£1,900/year. Report the actual pence/therm figure in currentValue.`;
}

/**
 * Strips Grok-specific XML citation tags from a text string.
 *
 * Grok inserts inline citation markup when the web plugin is active, e.g.:
 *   <grok:render type="render_inline_citation">
 *     <argument name="citation_id">29</argument>
 *   </grok:render>
 *
 * These tags are meaningless outside xAI's own UI and must be removed before
 * storing or displaying the text. We strip the entire tag and its inner content
 * so citations don't leave orphaned numbers or punctuation behind.
 */
export function stripGrokCitationTags(text: string): string {
  // Remove complete <grok:*>...</grok:*> blocks (including nested content)
  let cleaned = text.replace(/<grok:[^>]*>[\s\S]*?<\/grok:[^>]*>/g, "");

  // Remove any residual <argument ...>...</argument> tags that escaped the above
  cleaned = cleaned.replace(/<argument[^>]*>[\s\S]*?<\/argument>/g, "");

  // Remove any self-closing or unclosed <grok:*> or </grok:*> tags left over
  cleaned = cleaned.replace(/<\/?grok:[^>]*>/g, "");

  // Remove bracket-style citations: [web:36], [post:69], [web:114], etc.
  cleaned = cleaned.replace(/\[(?:web|post|x):\d+\]/g, "");

  // Collapse runs of whitespace created by the removals into a single space,
  // then trim leading/trailing whitespace.
  return cleaned.replace(/\s{2,}/g, " ").trim();
}

export function parseGrokResponse(raw: string): GrokAssessment[] {
  try {
    const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1] : raw;

    const parsed = JSON.parse(jsonStr.trim());
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidGrokAssessment).map((assessment) => ({
      ...assessment,
      // Strip Grok citation XML tags from any text fields that may contain them.
      // Doing this here, as close as possible to the API boundary, ensures the
      // tags never reach the database or the frontend.
      currentValue: stripGrokCitationTags(assessment.currentValue),
      reasoning: stripGrokCitationTags(assessment.reasoning),
    }));
  } catch {
    return [];
  }
}

export async function fetchGrokAssessments(): Promise<GrokAssessment[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });

  const prompt = buildGrokPrompt();

  const response = await client.chat.completions.create({
    model: GROK_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    // @ts-expect-error — OpenRouter-specific field not in OpenAI types
    plugins: [{ id: "web" }],
  });

  const content = response.choices[0]?.message?.content || "";
  return parseGrokResponse(content);
}
