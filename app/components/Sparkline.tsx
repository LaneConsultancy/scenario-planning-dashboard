import type { HistoryEntry } from "@/app/lib/types";

interface Props {
  history: HistoryEntry[];
  color: string;
  width?: number;
  height?: number;
}

export function Sparkline({ history, color, width = 80, height = 40 }: Props) {
  const values = history.map((h) => h.value).filter((v): v is number => v !== null);
  if (values.length < 2) return <div style={{ width, height }} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded overflow-hidden flex-shrink-0" style={{ width, height, background: `${color}11` }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%" }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" opacity="0.7" />
      </svg>
    </div>
  );
}
