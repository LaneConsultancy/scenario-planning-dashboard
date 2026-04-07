import type { Status } from "@/app/lib/types";
import { ACTION_GUIDANCE } from "@/app/lib/traffic-light";

const BANNER_STYLES: Record<Status, { bg: string; border: string; text: string }> = {
  GREEN: { bg: "rgba(46,204,113,0.08)", border: "rgba(46,204,113,0.2)", text: "#2ecc71" },
  AMBER: { bg: "rgba(240,192,64,0.08)", border: "rgba(240,192,64,0.2)", text: "#f0c040" },
  RED: { bg: "rgba(231,76,60,0.08)", border: "rgba(231,76,60,0.2)", text: "#e74c3c" },
};

interface Props {
  status: Status;
}

export function ActionBanner({ status }: Props) {
  const style = BANNER_STYLES[status];
  return (
    <div
      className="mt-4 rounded-lg px-5 py-3 inline-block text-sm"
      style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}
    >
      <strong>ACTION:</strong> {ACTION_GUIDANCE[status]}
    </div>
  );
}
