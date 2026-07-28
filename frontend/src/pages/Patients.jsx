import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Card } from "../components/Card";
import RiskBadge from "../components/RiskBadge";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatPercent, formatDate, ROLE_LABELS } from "../lib/format";

export default function Patients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  useEffect(() => {
    api.get("/patients").then((res) => setPatients(res.data)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchesQuery =
        !query ||
        p.full_name.toLowerCase().includes(query.toLowerCase()) ||
        p.mrn.toLowerCase().includes(query.toLowerCase());
      const matchesRisk = riskFilter === "All" || p.latest_risk?.risk_category === riskFilter;
      return matchesQuery && matchesRisk;
    });
  }, [patients, query, riskFilter]);

  const canCreate = user?.role === "doctor" || user?.role === "system_admin";

  return (
    <DashboardLayout
      title="Patients"
      subtitle={
        user?.role === "doctor"
          ? "Patients assigned to you"
          : user?.role === "healthcare_researcher"
          ? "Anonymized patient cohort"
          : "All patients across the hospital"
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-5">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or MRN…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--line)", background: "var(--paper-raised)" }}
            />
            <svg className="absolute left-3 top-3" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ borderColor: "var(--line)", background: "var(--paper-raised)", color: "var(--ink)" }}
          >
            {["All", "Low", "Medium", "High", "Critical"].map((r) => (
              <option key={r} value={r}>{r === "All" ? "All risk levels" : r}</option>
            ))}
          </select>
        </div>
        {canCreate && (
          <Link
            to="/predict"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold shrink-0"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            + New patient assessment
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--line-soft)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16">
          <p className="font-display text-lg" style={{ color: "var(--ink)" }}>No patients found</p>
          <p className="text-sm mt-1" style={{ color: "var(--ink-soft)" }}>
            {canCreate ? "Run a risk assessment to add your first patient." : "Try adjusting your search or filters."}
          </p>
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--line)" }}>
                {["Patient", "MRN", "Demographics", "Admitted", "Risk", ""].map((h) => (
                  <th key={h} className="px-5 py-3 font-semibold uppercase tracking-wide text-[11px]" style={{ color: "var(--ink-soft)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0 transition-colors hover:bg-[var(--line-soft)]" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="px-5 py-3.5 font-medium" style={{ color: "var(--ink)" }}>{p.full_name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "var(--ink-soft)" }}>{p.mrn}</td>
                  <td className="px-5 py-3.5" style={{ color: "var(--ink-soft)" }}>
                    {[p.gender, p.age_bracket].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "var(--ink-soft)" }}>{formatDate(p.admitted_at)}</td>
                  <td className="px-5 py-3.5">
                    {p.latest_risk ? (
                      <div className="flex items-center gap-2">
                        <RiskBadge category={p.latest_risk.risk_category} size="sm" />
                        <span className="font-mono text-xs" style={{ color: "var(--ink-soft)" }}>
                          {formatPercent(p.latest_risk.readmission_probability)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--ink-soft)" }}>Not assessed</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link to={`/patients/${p.id}`} className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </DashboardLayout>
  );
}
