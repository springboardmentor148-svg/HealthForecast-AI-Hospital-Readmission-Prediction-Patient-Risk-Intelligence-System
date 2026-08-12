export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${className}`}
      style={{ background: "var(--paper-raised)", borderColor: "var(--line)" }}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatTile({ label, value, unit, hint, accent }) {
  return (
    <Card className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>
        {label}
      </span>
      <span className="font-mono text-3xl font-semibold" style={{ color: accent || "var(--ink)" }}>
        {value}
        {unit && <span className="text-base ml-1 font-normal" style={{ color: "var(--ink-soft)" }}>{unit}</span>}
      </span>
      {hint && <span className="text-xs" style={{ color: "var(--ink-soft)" }}>{hint}</span>}
    </Card>
  );
}
