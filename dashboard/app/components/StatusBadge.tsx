import type { Status } from "@/app/lib/types";

const BADGE_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  RED: { label: "TRIGGERED", color: "#e74c3c", bg: "rgba(231,76,60,0.15)" },
  AMBER: { label: "WARNING", color: "#f0c040", bg: "rgba(240,192,64,0.15)" },
  GREEN: { label: "CLEAR", color: "#2ecc71", bg: "rgba(46,204,113,0.15)" },
};

interface Props {
  status: Status;
}

export function StatusBadge({ status }: Props) {
  const config = BADGE_CONFIG[status];
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: config.bg, color: config.color }}>
      {config.label}
    </span>
  );
}
