import { useEffect, useState } from "react";
import {
  FaFlask,
  FaChartLine,
  FaArrowTrendUp,
  FaPills,
} from "react-icons/fa6";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { fetchTreatmentAnalysis } from "../services/researchApi";

export function ResearcherTreatmentAnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchTreatmentAnalysis()
      .then(setData)
      .catch(() => setError("Could not load treatment analysis data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: "24px" }}>Loading treatment analysis...</p>;
  if (error) return <p style={{ padding: "24px", color: "crimson" }}>{error}</p>;

  const improvingCount = data.readmissionTrends.filter((r) => r.direction === "down").length;
  const improvingShare = data.readmissionTrends.length
    ? ((improvingCount / data.readmissionTrends.length) * 100).toFixed(1)
    : "0.0";

  const analysisStats = [
    { label: "Treatments Analyzed", value: data.treatmentsAnalyzed, icon: FaFlask },
    { label: "Avg. Effectiveness", value: data.avgEffectiveness, icon: FaChartLine },
    { label: "Improving Cohorts", value: `${improvingShare}%`, icon: FaArrowTrendUp },
    { label: "Medications Tracked", value: data.medicationsTracked, icon: FaPills },
  ];

  return (
    <>
      <div className="dashboard-page-header">
        <h1>Treatment Analysis</h1>
        <p>
          Aggregated treatment effectiveness and readmission trend
          analysis across anonymized patient cohorts.
        </p>
      </div>

      <section className="dashboard-card-grid">
        {analysisStats.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="dashboard-metric-card">
              <div className="metric-icon">
                <Icon />
              </div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          );
        })}
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-table-panel">
          <div className="panel-header-row">
            <div>
              <h2>Effectiveness by Treatment</h2>
              <p>Aggregated cohort-level effectiveness comparison</p>
            </div>
          </div>

          {data.effectivenessByTreatment.length === 0 ? (
            <p style={{ padding: "16px" }}>No treatment records logged yet.</p>
          ) : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={data.effectivenessByTreatment}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="treatment" tick={{ fontSize: 12 }} />
                  <YAxis unit="%" tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="effectiveness" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <aside className="dashboard-side-stack">
          <article className="dashboard-panel">
            <h2>Access Notice</h2>
            <p>
              Data shown is aggregated at the cohort level. Researcher
              accounts cannot view individual patient identifiers.
            </p>
          </article>
        </aside>
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-table-panel">
          <div className="panel-header-row">
            <div>
              <h2>Readmission Trend Reports</h2>
              <p>Aggregated readmission rate by treatment cohort</p>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Treatment</th>
                  <th>Cohort Size</th>
                  <th>Readmission Rate</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {data.readmissionTrends.length === 0 && (
                  <tr>
                    <td colSpan={4}>No treatment records logged yet.</td>
                  </tr>
                )}
                {data.readmissionTrends.map((row) => (
                  <tr key={row.treatment}>
                    <td>{row.treatment}</td>
                    <td>{row.cohortSize}</td>
                    <td>{row.readmissionRate}</td>
                    <td>
                      <span className={`risk-pill ${row.direction === "down" ? "low" : "high"}`}>
                        {row.direction === "down" ? "▼" : "▲"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </>
  );
}