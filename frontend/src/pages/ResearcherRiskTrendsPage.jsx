import { useEffect, useState } from "react";
import { FaChartLine, FaTriangleExclamation, FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import { fetchRiskTrends } from "../services/researchApi";

const trendIcon = { up: FaArrowTrendUp, down: FaArrowTrendDown };
const trendTone = { up: "high", down: "low" };

export function ResearcherRiskTrendsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchRiskTrends()
      .then(setData)
      .catch(() => setError("Could not load risk trend data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: "24px" }}>Loading risk trend data...</p>;
  if (error) return <p style={{ padding: "24px", color: "crimson" }}>{error}</p>;

  const riskSummary = [
    { label: "Records Scored (Aggregated)", value: data.recordsScored, icon: FaChartLine },
    { label: "High Risk Share", value: data.highRiskShare, icon: FaTriangleExclamation },
    { label: "Avg. Readmission Probability", value: data.avgReadmissionProbability, icon: FaChartLine },
    { label: "Model Confidence (Avg.)", value: data.avgModelConfidence, icon: FaChartLine },
  ];

  return (
    <>
      <section className="dashboard-page-header">
        <h1>Risk & Readmission Trends</h1>
        <p>Aggregated, anonymized readmission risk trends across the patient population.</p>
      </section>

      <section className="dashboard-card-grid">
        {riskSummary.map((card) => {
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

      <section className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header-row">
          <div>
            <h2>Monthly Readmission Risk Trend</h2>
            <p>Aggregated model output, no individual patient data included</p>
          </div>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Avg. Risk Score</th>
                <th>High Risk Share</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyTrend.length === 0 && (
                <tr>
                  <td colSpan={4}>No prediction data yet for this hospital.</td>
                </tr>
              )}
              {data.monthlyTrend.map((row) => {
                const TrendIcon = trendIcon[row.trend];
                return (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{row.avgRisk}</td>
                    <td>{row.highRiskShare}</td>
                    <td>
                      <span className={`risk-pill ${trendTone[row.trend]}`}>
                        <TrendIcon /> {row.trend === "up" ? "Rising" : "Improving"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}