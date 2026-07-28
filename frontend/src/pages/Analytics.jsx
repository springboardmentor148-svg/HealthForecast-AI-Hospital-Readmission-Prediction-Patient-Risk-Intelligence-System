import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line,
} from "recharts";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Card, StatTile } from "../components/Card";
import api from "../lib/api";

export default function Analytics() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/analytics/population-insights").then((res) => setInsights(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading || !insights) {
    return (
      <DashboardLayout title="Healthcare Analytics">
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--line-soft)" }} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Healthcare Analytics"
      subtitle="Population-level readmission patterns from the Diabetes 130-US Hospitals cohort"
    >
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatTile label="Encounters analyzed" value={insights.total_encounters.toLocaleString()} accent="var(--primary)" />
        <StatTile label="Overall readmission rate" value={`${insights.overall_readmission_rate}%`} accent="var(--accent)" hint="Readmitted within 30 days" />
        <StatTile
          label="30-day readmissions"
          value={insights.readmission_breakdown["<30"]?.toLocaleString() ?? "0"}
          hint={`of ${insights.total_encounters.toLocaleString()} encounters`}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <SectionHeading title="Readmission rate by age group" subtitle="Older cohorts trend toward higher risk" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={insights.readmission_rate_by_age}>
              <CartesianGrid strokeDasharray="3 5" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} interval={0} angle={-35} textAnchor="end" height={55} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} unit="%" width={36} />
              <Tooltip content={<ChartTooltip suffix="% readmitted <30d" />} />
              <Bar dataKey="rate" fill="var(--primary)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionHeading title="Readmission rate by admission type" subtitle="Emergency vs. elective vs. urgent" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={insights.readmission_rate_by_admission_type}>
              <CartesianGrid strokeDasharray="3 5" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} unit="%" width={36} />
              <Tooltip content={<ChartTooltip suffix="% readmitted <30d" />} />
              <Bar dataKey="rate" fill="var(--accent)" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeading title="Readmission rate by length of stay" subtitle="Longer stays generally correlate with higher risk" />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={insights.readmission_rate_by_length_of_stay}>
              <CartesianGrid strokeDasharray="3 5" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} unit="%" width={36} />
              <Tooltip content={<ChartTooltip suffix="% readmitted <30d" />} />
              <Line type="monotone" dataKey="rate" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="mb-4">
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
