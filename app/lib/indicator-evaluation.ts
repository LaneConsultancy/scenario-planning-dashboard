import { evaluateIndicatorStatus } from "./traffic-light";
import type { HistoryEntry, IndicatorDefinition, Status } from "./types";

interface IndicatorEvaluationResult {
  status: Status;
  triggered: boolean;
}

function hasSustainedThresholdBreach(
  numericValue: number,
  thresholdValue: number,
  thresholdDirection: "above" | "below",
  previousHistory: HistoryEntry[],
  minimumPoints: number
): boolean {
  const recentValues = [...previousHistory.map((entry) => entry.value), numericValue]
    .filter((value): value is number => value !== null)
    .slice(-minimumPoints);

  if (recentValues.length < minimumPoints) {
    return false;
  }

  return recentValues.every((value) =>
    thresholdDirection === "above" ? value >= thresholdValue : value <= thresholdValue
  );
}

export function evaluateIndicatorDefinition(
  definition: IndicatorDefinition,
  numericValue: number | null,
  previousHistory: HistoryEntry[],
  now: Date = new Date()
): IndicatorEvaluationResult | null {
  const { thresholdValue, thresholdDirection, warningPercent, evaluation } = definition;

  if (evaluation.kind === "ai-assessment") {
    return null;
  }

  if (evaluation.kind === "reference-only") {
    return { status: "GREEN", triggered: false };
  }

  if (evaluation.kind === "deadline-threshold") {
    if (now < new Date(evaluation.effectiveOn)) {
      return { status: "GREEN", triggered: false };
    }

    return evaluateIndicatorStatus(
      numericValue,
      thresholdValue,
      thresholdDirection,
      warningPercent
    );
  }

  const baseEvaluation = evaluateIndicatorStatus(
    numericValue,
    thresholdValue,
    thresholdDirection,
    warningPercent
  );

  if (evaluation.kind === "numeric-threshold" || !baseEvaluation) {
    return baseEvaluation;
  }

  if (baseEvaluation.status !== "RED" || numericValue === null || thresholdValue === null) {
    return baseEvaluation;
  }

  if (
    hasSustainedThresholdBreach(
      numericValue,
      thresholdValue,
      thresholdDirection,
      previousHistory,
      evaluation.minimumPoints
    )
  ) {
    return baseEvaluation;
  }

  return { status: "AMBER", triggered: false };
}
