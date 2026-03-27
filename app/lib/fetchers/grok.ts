import OpenAI from "openai";
import type { GrokAssessment } from "../types";

const GROK_MODEL = "x-ai/grok-4.1-fast";

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

7. id: "red-sea-houthi" — Are there ongoing Houthi attacks on shipping (>2/month)? Has Russia threatened or cut pipeline gas to Europe? Check latest Red Sea maritime security updates.`;
}

export function parseGrokResponse(raw: string): GrokAssessment[] {
  try {
    const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1] : raw;

    const parsed = JSON.parse(jsonStr.trim());
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item: unknown): item is GrokAssessment =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "status" in item &&
        "currentValue" in item &&
        "triggered" in item &&
        "reasoning" in item
    );
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
