import type {
  WeeklyTrend as WeeklyTrendData,
  TrendDirection,
} from "@/app/lib/trend";

const TREND_CONFIG: Record<
  TrendDirection,
  { label: string; color: string; arrow: string }
> = {
  // Arrow directions signal movement relative to danger, not numeric direction.
  // "improving" = moving away from risk threshold (↓ toward safety)
  // "stable"    = no meaningful change (→)
  // "worsening" = moving toward risk threshold (↑ toward danger)
  improving: { label: "Improving", color: "var(--green)", arrow: "\u2193" },
  stable: { label: "Stable", color: "var(--text-secondary)", arrow: "\u2192" },
  worsening: { label: "Worsening", color: "var(--red)", arrow: "\u2191" },
};

interface Props {
  trend: WeeklyTrendData;
}

export function WeeklyTrend({ trend }: Props) {
  const overall = TREND_CONFIG[trend.overallDirection];
  const total = trend.improving + trend.stable + trend.worsening;

  return (
    <div className="px-5 pb-4">
      <div
        className="text-xs uppercase tracking-widest mb-3"
        style={{ color: "var(--text-secondary)" }}
      >
        7-Day Trend
      </div>
      <div
        className="rounded-xl p-4"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Summary row */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-2xl" style={{ color: overall.color }}>
              {overall.arrow}
            </span>
            <span
              className="font-bold text-sm"
              style={{ color: overall.color }}
            >
              {overall.label}
            </span>
          </div>

          <div
            className="flex gap-4 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <span>
              <span
                style={{ color: "var(--green)", fontWeight: 600 }}
              >
                {trend.improving}
              </span>{" "}
              improving
            </span>
            <span>
              <span
                style={{ color: "var(--text-secondary)", fontWeight: 600 }}
              >
                {trend.stable}
              </span>{" "}
              stable
            </span>
            <span>
              <span style={{ color: "var(--red)", fontWeight: 600 }}>
                {trend.worsening}
              </span>{" "}
              worsening
            </span>
          </div>

          {/* Proportional colour bar */}
          {total > 0 && (
            <div
              className="flex-1 flex gap-0.5 h-1.5 rounded-full overflow-hidden ml-auto"
              style={{ minWidth: 120, maxWidth: 200 }}
            >
              {trend.improving > 0 && (
                <div
                  style={{
                    width: `${(trend.improving / total) * 100}%`,
                    background: "var(--green)",
                  }}
                />
              )}
              {trend.stable > 0 && (
                <div
                  style={{
                    width: `${(trend.stable / total) * 100}%`,
                    background: "var(--text-muted)",
                  }}
                />
              )}
              {trend.worsening > 0 && (
                <div
                  style={{
                    width: `${(trend.worsening / total) * 100}%`,
                    background: "var(--red)",
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Data-age caveat — only shown when we have less than a full week */}
        {trend.periodDays < 7 && (
          <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Based on {trend.periodDays} day
            {trend.periodDays !== 1 ? "s" : ""} of data (full trend available
            after 7 days)
          </div>
        )}

        {/* Per-indicator breakdown */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 mt-3 pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {trend.indicators.map((ind) => {
            const config = TREND_CONFIG[ind.direction];
            return (
              <div
                key={ind.id}
                className="flex items-center gap-2 text-xs py-0.5"
              >
                <span
                  style={{
                    color: config.color,
                    width: 14,
                    textAlign: "center",
                  }}
                >
                  {config.arrow}
                </span>
                <span style={{ color: "var(--text-muted)" }}>{ind.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
