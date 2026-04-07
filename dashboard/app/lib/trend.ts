import type { Indicator, Status } from "./types";

export type TrendDirection = "improving" | "stable" | "worsening";

export interface IndicatorTrend {
  id: string;
  name: string;
  direction: TrendDirection;
  previousStatus: Status | null;
  currentStatus: Status;
  statusChanged: boolean;
}

export interface WeeklyTrend {
  improving: number;
  stable: number;
  worsening: number;
  overallDirection: TrendDirection;
  indicators: IndicatorTrend[];
  periodDays: number;
}

/**
 * Calculate trend for a single indicator by comparing its current status
 * to its status ~7 days ago based on history data.
 *
 * For indicators with numeric values: compare current vs 7-day-ago value
 * relative to the threshold direction.
 * For AI-only indicators (no numeric history): compare current status to
 * the oldest available status in the history window.
 */
function getIndicatorTrend(indicator: Indicator): IndicatorTrend {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Find the history entry closest to 7 days ago
  const olderEntries = indicator.history.filter(
    (h) => new Date(h.date).getTime() <= sevenDaysAgo
  );

  // If we have numeric history, use value-based trend
  if (indicator.numericValue !== null && olderEntries.length > 0) {
    const oldEntry = olderEntries[olderEntries.length - 1]; // closest to 7 days ago
    if (oldEntry.value !== null) {
      const currentVal = indicator.numericValue;
      const oldVal = oldEntry.value;
      const delta = currentVal - oldVal;
      // Use 5% relative change or 0.5 absolute as the minimum meaningful movement
      const threshold = Math.abs(oldVal) * 0.05 || 0.5;

      if (Math.abs(delta) < threshold) {
        return {
          id: indicator.id,
          name: indicator.name,
          direction: "stable",
          previousStatus: null,
          currentStatus: indicator.status,
          statusChanged: false,
        };
      }

      // "improving" means moving AWAY from the danger threshold.
      // If thresholdDirection is "above", lower values are better (moving down = improving).
      // If thresholdDirection is "below", higher values are better (moving up = improving).
      const isMovingDown = delta < 0;
      const improving =
        indicator.thresholdDirection === "above" ? isMovingDown : !isMovingDown;

      return {
        id: indicator.id,
        name: indicator.name,
        direction: improving ? "improving" : "worsening",
        previousStatus: null,
        currentStatus: indicator.status,
        statusChanged: false,
      };
    }
  }

  // For AI-only or no-history indicators: not enough data to determine a meaningful trend
  if (indicator.history.length < 4) {
    return {
      id: indicator.id,
      name: indicator.name,
      direction: "stable",
      previousStatus: null,
      currentStatus: indicator.status,
      statusChanged: false,
    };
  }

  // Use triggerDate to infer: if triggered within the last 7 days, classify as worsening.
  // If sufficient history exists but it wasn't recently triggered, call it stable.
  if (indicator.triggered && indicator.triggerDate) {
    const triggerTime = new Date(indicator.triggerDate).getTime();
    if (triggerTime > sevenDaysAgo) {
      return {
        id: indicator.id,
        name: indicator.name,
        direction: "worsening",
        previousStatus: null,
        currentStatus: indicator.status,
        statusChanged: true,
      };
    }
  }

  return {
    id: indicator.id,
    name: indicator.name,
    direction: "stable",
    previousStatus: null,
    currentStatus: indicator.status,
    statusChanged: false,
  };
}

export function calculateWeeklyTrend(indicators: Indicator[]): WeeklyTrend {
  const trends = indicators.map(getIndicatorTrend);

  const improving = trends.filter((t) => t.direction === "improving").length;
  const worsening = trends.filter((t) => t.direction === "worsening").length;
  const stable = trends.filter((t) => t.direction === "stable").length;

  // Overall direction requires a margin of 3+ to avoid noise
  let overallDirection: TrendDirection = "stable";
  if (worsening > improving + 2) {
    overallDirection = "worsening";
  } else if (improving > worsening + 2) {
    overallDirection = "improving";
  }

  // How many days of data do we actually have?
  const allDates = indicators.flatMap((i) =>
    i.history.map((h) => new Date(h.date).getTime())
  );
  const oldestDate = allDates.length > 0 ? Math.min(...allDates) : Date.now();
  const periodDays = Math.min(
    7,
    Math.round((Date.now() - oldestDate) / (24 * 60 * 60 * 1000))
  );

  return {
    improving,
    stable,
    worsening,
    overallDirection,
    indicators: trends,
    periodDays,
  };
}
