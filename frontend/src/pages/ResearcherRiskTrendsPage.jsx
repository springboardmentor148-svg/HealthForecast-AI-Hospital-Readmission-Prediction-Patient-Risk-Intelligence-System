import { useState } from "react";
import { FaChartLine, FaTriangleExclamation, FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";

// Dummy data — aggregated risk/readmission trend, researcher ke liye
// individual patient identifiable info nahi, sirf hospital-wide aggregated numbers
const riskSummary = [
  { label: "Records Scored (Aggregated)", value: "18,940", icon: FaChartLine },
  { label: "High Risk Share", value: "14.3%", icon: FaTriangleExclamation },
  { label: "Avg. Readmission Probability", value: "8.7%", icon: FaChartLine },
  { label: "Model Confidence (Avg.)", value: "89.2%", icon: FaChartLine },
];

const monthlyTrend = [
  { month: "Feb 2026", avgRisk: "7.9%", highRiskShare: "12.8%", trend: "down" },
  { month: "Mar 2026", avgRisk: "8.1%", highRiskShare: "13.1%", trend: "up" },
  { month: "Apr 2026", avgRisk: "8.4%", highRiskShare: "13.6%", trend: "up" },
  { month: "May 2026", avgRisk: "8.2%", highRiskShare: "13.4%", trend: "down" },
  { month: "Jun 2026", avgRisk: "8.6%", highRiskShare: "14.0%", trend: "up" },
  { month: "Jul 2026", avgRisk: "8.7%", highRiskShare: "14.3%", trend: "up" },
];

const trendIcon = { up: FaArrowTrendUp, down: FaArrowTrendDown };
const trendTone = { up: "high", down: "low" };

export function ResearcherRiskTrendsPage() {
  const [rangeFilter, setRangeFilter] = useState("Last 6 Months");

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

          <div className="dashboard-toolbar">
            <select value={rangeFilter} onChange={(e) => setRangeFilter(e.target.value)}>
              <option>Last 6 Months</option>
              <option>Last 12 Months</option>
              <option>Year to Date</option>
            </select>
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
              {monthlyTrend.map((row) => {
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