import { RISK_META } from "../lib/format";

/**
 * The product's signature visual: a clinical-monitor style radial dial
 * reporting readmission probability, used consistently on patient cards,
 * the prediction workspace, and the dashboard vitals strip.
 */
export default function RiskDial({ probability = 0, category = "Low", size = 132, strokeWidth = 10 }) {
  const meta = RISK_META[category] || RISK_META.Low;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, probability));
  const dash = circumference * pct;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line-soft)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={meta.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-semibold" style={{ fontSize: size * 0.22, color: "var(--ink)" }}>
          {(pct * 100).toFixed(0)}
          <span style={{ fontSize: size * 0.12 }}>%</span>
        </span>
        <span
          className="uppercase tracking-wide font-semibold"
          style={{ fontSize: size * 0.09, color: meta.color, letterSpacing: "0.06em" }}
        >
          {category}
        </span>
      </div>
    </div>
  );
}
