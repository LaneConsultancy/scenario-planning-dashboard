import { getDashboardState } from "@/app/lib/kv";
import { TrafficLight } from "@/app/components/TrafficLight";
import { ActionBanner } from "@/app/components/ActionBanner";
import { CategoryCard } from "@/app/components/CategoryCard";
import { IndicatorCard } from "@/app/components/IndicatorCard";
import { WeeklyTrend } from "@/app/components/WeeklyTrend";
import { calculateWeeklyTrend } from "@/app/lib/trend";
import { calculateFreshness } from "@/app/lib/freshness";
import type { Category } from "@/app/lib/types";

export const revalidate = 0;

const CATEGORY_ORDER: Category[] = ["GEOPOLITICAL", "ENERGY", "AGRICULTURE", "POLITICAL", "CIVIL_LIBERTIES"];

const FRESHNESS_COLOR = { fresh: "#2ecc71", degraded: "#f0c040", stale: "#e74c3c" } as const;

function formatAge(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 1) return "under 1h";
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default async function DashboardPage() {
  let state = null;
  try {
    state = await getDashboardState();
  } catch {
    // KV not configured or unreachable — show empty state
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Paraguay Decision Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            No data yet. Trigger a refresh at <code>/api/cron/refresh</code> or wait for the next scheduled run.
          </p>
        </div>
      </div>
    );
  }

  const freshness = calculateFreshness(state.indicators);
  const freshnessColor = FRESHNESS_COLOR[freshness.level];
  const freshnessTitle =
    freshness.level === "fresh"
      ? "All indicators updated within the last refresh cycle"
      : `${freshness.staleCount} of ${freshness.total} indicators stale` +
        (freshness.oldestAgeMs !== null ? ` — oldest ${formatAge(freshness.oldestAgeMs)} old` : "");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="flex justify-between items-center px-5 py-3" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)" }}>
        <div className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Paraguay Decision Dashboard</div>
        <div className="flex gap-4 items-center">
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            Last: {new Date(state.lastRefresh).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
          </span>
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            Next: {new Date(state.nextRefresh).toLocaleString("en-GB", { timeStyle: "short" })}
          </span>
          {freshness.staleCount > 0 && (
            <span className="text-xs font-mono" style={{ color: freshnessColor }}>
              {freshness.staleCount} stale
            </span>
          )}
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: freshnessColor }} title={freshnessTitle} />
        </div>
      </div>

      <div className="py-8 text-center">
        <TrafficLight status={state.overall} triggeredCount={state.triggeredCount} total={state.indicators.length} />
        <ActionBanner status={state.overall} />
      </div>

      <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {CATEGORY_ORDER.map((cat) => {
          const summary = state.categories[cat];
          if (!summary) return null;
          return (
            <CategoryCard
              key={cat}
              category={cat}
              summary={summary}
              indicators={state.indicators.filter((i) => i.category === cat)}
            />
          );
        })}
      </div>

      <WeeklyTrend trend={calculateWeeklyTrend(state.indicators)} />

      <div className="px-5 pb-8">
        <div className="text-xs uppercase tracking-widest mb-3" style={{ color: "var(--text-secondary)" }}>
          Indicator Details
        </div>
        {state.indicators.map((indicator) => (
          <IndicatorCard key={indicator.id} indicator={indicator} />
        ))}
      </div>

      <div className="flex justify-between px-5 py-3" style={{ background: "var(--bg-secondary)", borderTop: "1px solid var(--border)" }}>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Sources: AGSI, ONS, ACLED, UKHSA, GOV.UK, Grok AI via OpenRouter
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Refreshes every 12 hours</span>
      </div>
    </div>
  );
}
