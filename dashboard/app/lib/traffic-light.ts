import type { Status, Indicator, CategorySummary } from "./types";

const STATUS_PRIORITY: Record<Status, number> = { GREEN: 0, AMBER: 1, RED: 2 };

export function evaluateIndicatorStatus(
  numericValue: number | null,
  thresholdValue: number | null,
  thresholdDirection: "above" | "below",
  warningPercent: number
): { status: Status; triggered: boolean } | null {
  if (numericValue === null || thresholdValue === null) return null;

  if (thresholdDirection === "above") {
    const warningLevel = thresholdValue * warningPercent;
    if (numericValue >= thresholdValue) return { status: "RED", triggered: true };
    if (numericValue >= warningLevel) return { status: "AMBER", triggered: false };
    return { status: "GREEN", triggered: false };
  }

  const warningLevel = thresholdValue / warningPercent;
  if (numericValue <= thresholdValue) return { status: "RED", triggered: true };
  if (numericValue <= warningLevel) return { status: "AMBER", triggered: false };
  return { status: "GREEN", triggered: false };
}

export function calculateCategoryStatus(indicators: Indicator[]): CategorySummary {
  let worstStatus: Status = "GREEN";
  let triggeredCount = 0;

  for (const ind of indicators) {
    if (ind.triggered) triggeredCount++;
    if (STATUS_PRIORITY[ind.status] > STATUS_PRIORITY[worstStatus]) {
      worstStatus = ind.status;
    }
  }

  return { status: worstStatus, triggeredCount, total: indicators.length };
}

export function calculateOverallStatus(triggeredCount: number): Status {
  if (triggeredCount >= 4) return "RED";
  if (triggeredCount >= 2) return "AMBER";
  return "GREEN";
}

export const ACTION_GUIDANCE: Record<Status, string> = {
  GREEN:
    "Stay put — all indicators improving. Hormuz partial reopen + storage refill on track + fertilizer stabilizing.",
  AMBER:
    "Start 6-month Paraguay planning — property valuation, visa research, remote job/finances alignment.",
  RED:
    "Execute sale/move — commit to listing property. Oct–March 2027 buffer before peak winter scarcity.",
};
