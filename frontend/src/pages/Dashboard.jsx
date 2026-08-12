import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Card, StatTile } from "../components/Card";
import RiskBadge from "../components/RiskBadge";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS, RISK_META, formatPercent, formatDate } from "../lib/format";

export default function Dashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [insights, setInsights] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/analytics/hospital-overview"),
      api.get("/analytics/population-insights"),
      api.get("/patients"),
    ])
      .then(([o, i, p]) => {
        setOverview(o.data);
        setInsights(i.data);
        setPatients(p.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  const riskPieData = overview
    ? Object.entries(overview.risk_distribution || {}).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.full_name?.split(" ")[0] || ""}`}
      subtitle={ROLE_LABELS[user?.role]}
    >
      {loading ? (
        <SkeletonState />
      ) : (
        <div className="space-y-6">
          {/* Vitals strip — signature element */}
          <Card className="!p-0 overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x" style={{ borderColor: "var(--line)" }}>
              <VitalCell label="Patients tracked" value={overview.total_patients} />
              <VitalCell label="Risk assessments run" value={overview.total_risk_assessments} />
              <VitalCell
                label="Avg. readmission risk"
                value={formatPercent(overview.average_readmission_probability)}
                accent="var(--primary)"
              />
              <VitalCell label="Active doctors" value={overview.active_doctors} />
            </div>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Population readmission trend by length of stay */}
            <Card className="lg:col-span-2">
              <SectionHeading
                title="Readmission rate by length of stay"
                subtitle="Historical cohort · Diabetes 130-US Hospitals dataset"
              />
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={insights.readmission_rate_by_length_of_stay}>
                  <defs>
                    <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 5" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} unit="%" width={36} />
                  <Tooltip content={<ChartTooltip suffix="% readmitted <30d" />} />
                  <Area type="monotone" dataKey="rate" stroke="var(--primary)" strokeWidth={2} fill="url(#fillPrimary)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Risk distribution pie */}
            <Card>
              <SectionHeading title="Current risk mix" subtitle="Latest assessment per patient" />
              {riskPieData.length === 0 ? (
                <EmptyMini text="No assessments recorded yet." />
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={riskPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {riskPieData.map((entry) => (
                        <Cell key={entry.name} fill={RISK_META[entry.name]?.color || "var(--ink-soft)"} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip suffix=" patients" />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="flex flex-wrap gap-3 mt-1 justify-center">
                {riskPieData.map((d) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--ink-soft)" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: RISK_META[d.name]?.color }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <SectionHeading title="Readmission rate by medication burden" subtitle="Cohort-level pattern" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={insights.readmission_rate_by_medication_count}>
                  <CartesianGrid strokeDasharray="3 5" stroke="var(--line)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} unit="%" width={36} />
                  <Tooltip content={<ChartTooltip suffix="% readmitted <30d" />} />
                  <Bar dataKey="rate" fill="var(--accent)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-3">
                <SectionHeading title="Recent patients" subtitle="Latest activity" noMargin />
                <Link to="/patients" className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                  View all →
                </Link>
              </div>
              {patients.length === 0 ? (
                <EmptyMini text="No patients yet." />
              ) : (
                <ul className="space-y-2.5 mt-2">
                  {patients.map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/patients/${p.id}`}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--line-soft)]"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>{p.full_name}</p>
                          <p className="text-[11px] font-mono" style={{ color: "var(--ink-soft)" }}>{p.mrn}</p>
                        </div>
                        {p.latest_risk && <RiskBadge category={p.latest_risk.risk_category} size="sm" />}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function VitalCell({ label, value, accent }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--ink-soft)" }}>{label}</p>
      <p className="font-mono text-2xl font-semibold" style={{ color: accent || "var(--ink)" }}>{value}</p>
    </div>
  );
}

function SectionHeading({ title, subtitle, noMargin }) {
  return (
    <div className={noMargin ? "" : "mb-4"}>
      <h3 className="font-display text-base font-semibold" style={{ color: "var(--ink)" }}>{title}</h3>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>{subtitle}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label, suffix = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border px-3 py-2 text-xs shadow-sm" style={{ background: "var(--paper-raised)", borderColor: "var(--line)" }}>
      <p className="font-semibold mb-0.5" style={{ color: "var(--ink)" }}>{label}</p>
      <p style={{ color: "var(--primary)" }}>{payload[0].value}{suffix}</p>
    </div>
  );
}

function EmptyMini({ text }) {
  return (
    <div className="flex items-center justify-center h-[180px] text-sm" style={{ color: "var(--ink-soft)" }}>
      {text}
    </div>
  );
}

function SkeletonState() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 rounded-2xl" style={{ background: "var(--line-soft)" }} />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 rounded-2xl" style={{ background: "var(--line-soft)" }} />
        <div className="h-64 rounded-2xl" style={{ background: "var(--line-soft)" }} />
      </div>
    </div>
  );
}
