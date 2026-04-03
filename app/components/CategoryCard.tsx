import type { Status, CategorySummary, Indicator } from "@/app/lib/types";
import { Sparkline } from "./Sparkline";

const STATUS_COLOR: Record<Status, string> = { GREEN: "#2ecc71", AMBER: "#f0c040", RED: "#e74c3c" };
const CATEGORY_LABELS: Record<string, string> = {
  GEOPOLITICAL: "Geopolitical", ENERGY: "Energy", AGRICULTURE: "Agriculture", POLITICAL: "Political", CIVIL_LIBERTIES: "Civil Liberties",
};

interface Props {
  category: string;
  summary: CategorySummary;
  indicators: Indicator[];
}

export function CategoryCard({ category, summary, indicators }: Props) {
  const color = STATUS_COLOR[summary.status];
  const sparkIndicator = indicators.find((i) => i.history.length > 1);

  return (
    <div className="rounded-xl p-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderLeft: `3px solid ${color}` }}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
          {CATEGORY_LABELS[category] || category}
        </span>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}80` }} />
      </div>
      <div className="font-bold text-sm" style={{ color }}>{summary.status}</div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
        {summary.triggeredCount}/{summary.total} triggered
      </div>
      {sparkIndicator && (
        <div className="mt-2">
          <Sparkline history={sparkIndicator.history} color={color} width={200} height={20} />
        </div>
      )}
    </div>
  );
}
