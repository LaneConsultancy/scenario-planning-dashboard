export type Status = "GREEN" | "AMBER" | "RED";

export type Category = "GEOPOLITICAL" | "ENERGY" | "AGRICULTURE" | "POLITICAL" | "CIVIL_LIBERTIES";

export interface HistoryEntry {
  value: number | null;
  status?: Status;
  date: string;
}

export interface Indicator {
  id: string;
  category: Category;
  name: string;
  status: Status;
  currentValue: string;
  numericValue: number | null;
  threshold: string;
  thresholdValue: number | null;
  thresholdDirection: "above" | "below";
  source: string;
  lastUpdated: string;
  triggered: boolean;
  triggerDate: string | null;
  downgradeStreak: number;
  aiReasoning: string | null;
  history: HistoryEntry[];
}

export interface CategorySummary {
  status: Status;
  triggeredCount: number;
  total: number;
}

export interface DashboardState {
  overall: Status;
  triggeredCount: number;
  categories: Record<Category, CategorySummary>;
  indicators: Indicator[];
  lastRefresh: string;
  nextRefresh: string;
}

export interface IndicatorDefinition {
  id: string;
  category: Category;
  name: string;
  threshold: string;
  thresholdValue: number | null;
  thresholdDirection: "above" | "below";
  warningPercent: number;
  source: string;
  fetchTier: "api" | "scrape" | "ai";
  evaluation:
    | { kind: "ai-assessment" }
    | { kind: "numeric-threshold" }
    | { kind: "deadline-threshold"; effectiveOn: string }
    | { kind: "sustained-threshold"; minimumPoints: number }
    | { kind: "reference-only" };
}

export interface FetchResult {
  id: string;
  currentValue: string;
  numericValue: number | null;
  aiReasoning: string | null;
  source: string;
}

export interface GrokAssessment {
  id: string;
  status: Status;
  currentValue: string;
  triggered: boolean;
  reasoning: string;
}
