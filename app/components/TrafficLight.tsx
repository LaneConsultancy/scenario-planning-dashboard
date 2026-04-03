import type { Status } from "@/app/lib/types";

const LIGHT_CONFIG: Record<Status, { label: string; color: string; shadow: string }> = {
  GREEN: { label: "GREEN", color: "#2ecc71", shadow: "rgba(46,204,113,0.4)" },
  AMBER: { label: "AMBER", color: "#f0c040", shadow: "rgba(240,192,64,0.4)" },
  RED: { label: "RED", color: "#e74c3c", shadow: "rgba(231,76,60,0.4)" },
};

interface Props {
  status: Status;
  triggeredCount: number;
  total: number;
}

export function TrafficLight({ status, triggeredCount, total }: Props) {
  const active = LIGHT_CONFIG[status];
  const lights: Status[] = ["GREEN", "AMBER", "RED"];

  return (
    <div className="inline-flex flex-col items-center rounded-2xl px-10 py-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex gap-3 mb-3">
        {lights.map((light) => {
          const isActive = light === status;
          const config = LIGHT_CONFIG[light];
          return (
            <div
              key={light}
              className="w-8 h-8 rounded-full"
              style={{
                background: isActive ? config.color : "#333",
                border: `2px solid ${isActive ? config.color : "#444"}`,
                boxShadow: isActive ? `0 0 20px ${config.shadow}` : "none",
              }}
            />
          );
        })}
      </div>
      <div className="font-extrabold text-xl tracking-widest" style={{ color: active.color }}>
        {active.label}
      </div>
      <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
        {triggeredCount} of {total} indicators triggered
      </div>
    </div>
  );
}
