export const ROLE_LABELS = {
  doctor: "Doctor",
  hospital_administrator: "Hospital Administrator",
  healthcare_researcher: "Healthcare Researcher",
  system_admin: "System Administrator",
};

export const ROLE_DESCRIPTIONS = {
  doctor: "Monitor assigned patients, review risk & discharge planning",
  hospital_administrator: "Hospital-wide performance & readmission oversight",
  healthcare_researcher: "Anonymized population health & outcomes research",
  system_admin: "Platform, user & AI model administration",
};

export const RISK_META = {
  Low: { color: "var(--risk-low)", soft: "var(--risk-low-soft)", order: 0 },
  Medium: { color: "var(--risk-medium)", soft: "var(--risk-medium-soft)", order: 1 },
  High: { color: "var(--risk-high)", soft: "var(--risk-high-soft)", order: 2 },
  Critical: { color: "var(--risk-critical)", soft: "var(--risk-critical-soft)", order: 3 },
};

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
