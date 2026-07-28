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

const analysisStats = [
  { label: "Treatments Analyzed", value: "12", icon: FaFlask },
  { label: "Avg. Effectiveness", value: "82.1%", icon: FaChartLine },
  { label: "Improving Trend", value: "+4.3%", icon: FaArrowTrendUp },
  { label: "Medications Tracked", value: "9", icon: FaPills },
];

const effectivenessTrend = [
  { treatment: "Metformin", effectiveness: 88 },
  { treatment: "Insulin Adj.", effectiveness: 79 },
  { treatment: "Combined Tx", effectiveness: 84 },
  { treatment: "Lifestyle Prog.", effectiveness: 71 },
  { treatment: "GLP-1 Therapy", effectiveness: 90 },
];

const readmissionTrends = [
  { treatment: "Metformin regimen", cohortSize: "1,204", readmissionRate: "9.2%", trend: "1.1%", direction: "down" },
  { treatment: "Insulin adjustment", cohortSize: "876", readmissionRate: "14.6%", trend: "0.6%", direction: "up" },
  { treatment: "Combined therapy", cohortSize: "542", readmissionRate: "11.8%", trend: "2.4%", direction: "down" },
  { treatment: "Lifestyle program", cohortSize: "398", readmissionRate: "17.3%", trend: "1.2%", direction: "up" },
];

export function ResearcherTreatmentAnalysisPage() {
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

          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={effectivenessTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="treatment" tick={{ fontSize: 12 }} />
                <YAxis unit="%" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="effectiveness" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
                {readmissionTrends.map((row) => (
                  <tr key={row.treatment}>
                    <td>{row.treatment}</td>
                    <td>{row.cohortSize}</td>
                    <td>{row.readmissionRate}</td>
                    <td>
                      <span className={`risk-pill ${row.direction === "down" ? "low" : "high"}`}>
                        {row.direction === "down" ? "▼" : "▲"} {row.trend}
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