import type { Indicator } from "@/app/lib/types";
import { StatusBadge } from "./StatusBadge";
import { Sparkline } from "./Sparkline";

const STATUS_COLOR = { GREEN: "#2ecc71", AMBER: "#f0c040", RED: "#e74c3c" } as const;
const CATEGORY_LABELS: Record<string, string> = {
  GEOPOLITICAL: "Geopolitical", ENERGY: "Energy", AGRICULTURE: "Agriculture", POLITICAL: "Political", CIVIL_LIBERTIES: "Civil Liberties",
};

interface Props {
  indicator: Indicator;
}

export function IndicatorCard({ indicator }: Props) {
  const color = STATUS_COLOR[indicator.status];
  const isStale = new Date().getTime() - new Date(indicator.lastUpdated).getTime() > 12 * 60 * 60 * 1000;
  const daysSinceTrigger = indicator.triggerDate
    ? Math.floor((new Date().getTime() - new Date(indicator.triggerDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="rounded-lg p-4 mb-2" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderLeft: `3px solid ${color}` }}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{indicator.name}</span>
            <StatusBadge status={indicator.status} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{CATEGORY_LABELS[indicator.category]}</span>
            {isStale && (
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#9a9ab0" }}>STALE</span>
            )}
          </div>
          <div className="flex gap-5 mt-2">
            <div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Current</div>
              <div className="font-bold text-sm font-mono" style={{ color }}>{indicator.numericValue !== null ? indicator.numericValue : "—"}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{indicator.currentValue.slice(0, 40)}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Threshold</div>
              <div className="font-bold text-sm font-mono" style={{ color: "var(--text-secondary)" }}>{indicator.thresholdValue !== null ? indicator.thresholdValue : "AI"}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{indicator.threshold.slice(0, 40)}</div>
            </div>
            {indicator.triggered && daysSinceTrigger !== null && (
              <div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>Triggered</div>
                <div className="font-bold text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                  {new Date(indicator.triggerDate!).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{daysSinceTrigger}d ago</div>
              </div>
            )}
          </div>
          {indicator.aiReasoning && (
            <div className="text-xs mt-2 italic" style={{ color: "var(--text-muted)" }}>
              &ldquo;{indicator.aiReasoning}&rdquo; — Grok AI
            </div>
          )}
        </div>
        <Sparkline history={indicator.history} color={color} />
      </div>
    </div>
  );
}
