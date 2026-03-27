import { IndicatorDefinition } from "./types";

const AI_ASSESSMENT = { kind: "ai-assessment" } as const;
const REFERENCE_ONLY = { kind: "reference-only" } as const;

export const INDICATOR_DEFINITIONS: IndicatorDefinition[] = [
  // === GEOPOLITICAL ===
  {
    id: "hormuz-transit",
    category: "GEOPOLITICAL",
    name: "Hormuz Transit Data",
    threshold: "<10% of normal daily tankers",
    thresholdValue: 10,
    thresholdDirection: "below",
    warningPercent: 0.8,
    source: "WTO Hormuz Trade Tracker + Grok AI",
    fetchTier: "scrape",
    evaluation: AI_ASSESSMENT,
  },
  {
    id: "red-sea-houthi",
    category: "GEOPOLITICAL",
    name: "Red Sea / Houthi Activity",
    threshold: ">2 confirmed tanker attacks/month OR Russia pipeline cuts",
    thresholdValue: 2,
    thresholdDirection: "above",
    warningPercent: 0.8,
    source: "Grok AI (web search)",
    fetchTier: "ai",
    evaluation: AI_ASSESSMENT,
  },
  {
    id: "iea-disruption",
    category: "GEOPOLITICAL",
    name: "IEA Disruption Assessment",
    threshold: "IEA upgrades to 'largest disruption in history' with no de-escalation by July",
    thresholdValue: null,
    thresholdDirection: "above",
    warningPercent: 0.8,
    source: "Grok AI (web search)",
    fetchTier: "ai",
    evaluation: AI_ASSESSMENT,
  },
  // === ENERGY ===
  {
    id: "gas-storage",
    category: "ENERGY",
    name: "EU Gas Storage Refill",
    threshold: "<50% full by 30 June 2026",
    thresholdValue: 50,
    thresholdDirection: "below",
    warningPercent: 0.8,
    source: "AGSI API (Gas Infrastructure Europe)",
    fetchTier: "api",
    evaluation: {
      kind: "deadline-threshold",
      effectiveOn: "2026-06-30T00:00:00.000Z",
    },
  },
  {
    id: "gas-price",
    category: "ENERGY",
    name: "Wholesale Gas/Electricity Price",
    threshold: "TTF >£1.50/therm sustained OR Ofgem cap >£1,900/year",
    thresholdValue: 150,
    thresholdDirection: "above",
    warningPercent: 0.8,
    source: "OilPriceAPI (TTF gas)",
    fetchTier: "api",
    evaluation: {
      kind: "sustained-threshold",
      minimumPoints: 4,
    },
  },
  {
    id: "industrial-curtailment",
    category: "ENERGY",
    name: "Industrial Force Majeure",
    threshold: ">3 major UK plants announce gas cuts by August",
    thresholdValue: 3,
    thresholdDirection: "above",
    warningPercent: 0.8,
    source: "Grok AI (web search)",
    fetchTier: "ai",
    evaluation: AI_ASSESSMENT,
  },
  // === AGRICULTURE ===
  {
    id: "fertilizer-price",
    category: "AGRICULTURE",
    name: "Fertilizer & Red Diesel Prices",
    threshold: "Nitrogen/urea >+40% YoY sustained OR red diesel >110ppl",
    thresholdValue: 40,
    thresholdDirection: "above",
    warningPercent: 0.8,
    source: "AHDB + Grok AI (web search)",
    fetchTier: "ai",
    evaluation: AI_ASSESSMENT,
  },
  {
    id: "nfu-warnings",
    category: "AGRICULTURE",
    name: "NFU / Defra Warnings",
    threshold: "Formal 'food production at risk' statement OR >20% farmers report reduced planting",
    thresholdValue: null,
    thresholdDirection: "above",
    warningPercent: 0.8,
    source: "GOV.UK Content API + Grok AI",
    fetchTier: "ai",
    evaluation: AI_ASSESSMENT,
  },
  {
    id: "food-inflation",
    category: "AGRICULTURE",
    name: "Food Price Inflation",
    threshold: "UK food CPI >10% cumulative for 2027",
    thresholdValue: 10,
    thresholdDirection: "above",
    warningPercent: 0.8,
    source: "ONS Beta API",
    fetchTier: "api",
    evaluation: REFERENCE_ONLY,
  },
  // === POLITICAL ===
  {
    id: "govt-contingency",
    category: "POLITICAL",
    name: "Government Contingency Shift",
    threshold: "Minister/DESNZ statement on 'targeted measures,' emergency summit, or subsidy caps",
    thresholdValue: null,
    thresholdDirection: "above",
    warningPercent: 0.8,
    source: "GOV.UK Content API + Grok AI",
    fetchTier: "ai",
    evaluation: AI_ASSESSMENT,
  },
  {
    id: "political-stability",
    category: "POLITICAL",
    name: "By-elections & Protest Activity",
    threshold: "Labour loses >2 by-elections badly OR protests turn violent/widespread",
    thresholdValue: 2,
    thresholdDirection: "above",
    warningPercent: 0.8,
    source: "Grok AI (web search)",
    fetchTier: "ai",
    evaluation: AI_ASSESSMENT,
  },
  {
    id: "health-emergency",
    category: "POLITICAL",
    name: "Public Health Escalation",
    threshold: "UKHSA national emergency declaration OR >50 linked outbreak cases",
    thresholdValue: 50,
    thresholdDirection: "above",
    warningPercent: 0.8,
    source: "UKHSA Dashboard API",
    fetchTier: "api",
    evaluation: REFERENCE_ONLY,
  },
];

export function getDefinition(id: string): IndicatorDefinition {
  const def = INDICATOR_DEFINITIONS.find((d) => d.id === id);
  if (!def) throw new Error(`Unknown indicator: ${id}`);
  return def;
}

export function getDefinitionsByCategory(category: string): IndicatorDefinition[] {
  return INDICATOR_DEFINITIONS.filter((d) => d.category === category);
}
