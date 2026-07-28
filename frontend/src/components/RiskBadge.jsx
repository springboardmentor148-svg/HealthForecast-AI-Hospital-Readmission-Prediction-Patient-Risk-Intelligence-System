import { RISK_META } from "../lib/format";

export default function RiskBadge({ category, size = "md" }) {
  const meta = RISK_META[category] || RISK_META.Low;
  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wide ${padding}`}
      style={{ background: meta.soft, color: meta.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
      {category}
    </span>
  );
}
