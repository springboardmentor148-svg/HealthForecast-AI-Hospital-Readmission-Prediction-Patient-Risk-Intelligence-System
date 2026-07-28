import { useState } from "react";
import { FaChartLine, FaTriangleExclamation, FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";

// Dummy data — hospital-wide risk & readmission forecast (baad me API se aayega)
const riskSummary = [
  { label: "Patients Scored This Month", value: "2,184", icon: FaChartLine },
  { label: "High Risk Patients", value: "312", icon: FaTriangleExclamation },
  { label: "Avg. Readmission Probability", value: "8.4%", icon: FaArrowTrendUp },
  { label: "Forecast Accuracy", value: "92.4%", icon: FaChartLine },
];

const departmentForecast = [
  { department: "Cardiology", patientsScored: 486, highRisk: 62, forecastedReadmission: "6.2%", trend: "down" },
  { department: "Endocrinology", patientsScored: 398, highRisk: 91, forecastedReadmission: "11.8%", trend: "up" },
  { department: "General Surgery", patientsScored: 512, highRisk: 48, forecastedReadmission: "7.1%", trend: "down" },
  { department: "Neurology", patientsScored: 274, highRisk: 39, forecastedReadmission: "8.9%", trend: "up" },
  { department: "Emergency Medicine", patientsScored: 514, highRisk: 72, forecastedReadmission: "9.5%", trend: "down" },
];

const trendIcon = { up: FaArrowTrendUp, down: FaArrowTrendDown };
const trendTone = { up: "high", down: "low" };

export function HospitalAdminRiskForecastPage() {
  const [monthFilter, setMonthFilter] = useState("This Month");

  return (
    <>
      <section className="dashboard-page-header">
        <h1>Risk & Readmission Analytics</h1>
        <p>Hospital-wide readmission risk scoring and forecasted trends across departments.</p>
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
            <h2>Department-wise Readmission Forecast</h2>
            <p>Predicted readmission trend based on current risk scoring</p>
          </div>

          <div className="dashboard-toolbar">
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last 3 Months</option>
            </select>
          </div>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Patients Scored</th>
                <th>High Risk Count</th>
                <th>Forecasted Readmission Rate</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {departmentForecast.map((row) => {
                const TrendIcon = trendIcon[row.trend];
                return (
                  <tr key={row.department}>
                    <td>{row.department}</td>
                    <td>{row.patientsScored}</td>
                    <td>{row.highRisk}</td>
                    <td>{row.forecastedReadmission}</td>
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