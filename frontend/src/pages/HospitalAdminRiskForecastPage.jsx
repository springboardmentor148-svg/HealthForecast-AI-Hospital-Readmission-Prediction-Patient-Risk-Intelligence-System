import { useEffect, useState } from "react";
import { FaChartLine, FaTriangleExclamation, FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import { fetchHospitalRiskForecast } from "../services/hospitalAdminApi.js";

const summaryIcons = {
  "Patients Scored This Month": FaChartLine,
  "High Risk Patients": FaTriangleExclamation,
  "Avg. Readmission Probability": FaArrowTrendUp,
  "Forecast Accuracy": FaChartLine,
};

const trendIcon = { up: FaArrowTrendUp, down: FaArrowTrendDown };
const trendTone = { up: "high", down: "low" };

export function HospitalAdminRiskForecastPage() {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [monthFilter, setMonthFilter] = useState("This Month");

  useEffect(() => {
    async function loadRiskForecast() {
      try {
        setLoading(true);
        const data = await fetchHospitalRiskForecast();
        setRiskData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadRiskForecast();
  }, []);

  if (loading) {
    return (
      <section className="dashboard-page-header">
        <h1>Loading risk forecast...</h1>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-page-header">
        <h1>Risk & Readmission Analytics</h1>
        <p style={{ color: "red" }}>{error}</p>
      </section>
    );
  }

  return (
    <>
      <section className="dashboard-page-header">
        <h1>Risk & Readmission Analytics</h1>
        <p>Hospital-wide readmission risk scoring and forecasted trends across departments.</p>
      </section>

      <section className="dashboard-card-grid">
        {riskData.summary.map((card) => {
          const Icon = summaryIcons[card.label] || FaChartLine;
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
              {riskData.departmentForecast.length === 0 ? (
                <tr>
                  <td colSpan={5}>No departments added yet.</td>
                </tr>
              ) : (
                riskData.departmentForecast.map((row) => {
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
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}