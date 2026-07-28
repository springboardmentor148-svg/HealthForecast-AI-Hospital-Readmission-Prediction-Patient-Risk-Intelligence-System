import { FaUsers, FaHeartPulse, FaChartPie, FaFileExport } from "react-icons/fa6";

// Dummy data — anonymized population-level trends (baad me API se aayega)
const populationStats = [
  { label: "Total Anonymized Records", value: "18,940", icon: FaUsers },
  { label: "Chronic Condition Records", value: "8,102", icon: FaHeartPulse },
  { label: "Avg. Age Group", value: "55-64 yrs", icon: FaChartPie },
];

const conditionBreakdown = [
  { condition: "Type 2 Diabetes", records: "3,612", avgReadmission: "9.1%" },
  { condition: "Hypertension", records: "2,984", avgReadmission: "6.4%" },
  { condition: "Heart Failure", records: "1,742", avgReadmission: "13.2%" },
  { condition: "COPD", records: "1,318", avgReadmission: "10.8%" },
  { condition: "Chronic Kidney Disease", records: "986", avgReadmission: "12.5%" },
];

const ageGroupBreakdown = [
  { ageGroup: "18-34", records: "1,204", readmissionRate: "4.2%" },
  { ageGroup: "35-49", records: "3,486", readmissionRate: "6.8%" },
  { ageGroup: "50-64", records: "6,912", readmissionRate: "9.4%" },
  { ageGroup: "65-79", records: "5,208", readmissionRate: "11.6%" },
  { ageGroup: "80+", records: "2,130", readmissionRate: "14.3%" },
];

export function ResearcherPopulationHealthPage() {
  return (
    <>
      <section className="dashboard-page-header">
        <h1>Population Health Reports</h1>
        <p>Aggregated, anonymized health trends across the entire patient population.</p>
      </section>

      <section className="dashboard-card-grid">
        {populationStats.map((card) => {
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
              <h2>Condition Breakdown</h2>
              <p>Anonymized record count and readmission rate by chronic condition</p>
            </div>

            <div className="dashboard-inline-actions">
              <button type="button" className="secondary-button">
                <FaFileExport /> Export
              </button>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Condition</th>
                  <th>Records</th>
                  <th>Avg. Readmission Rate</th>
                </tr>
              </thead>
              <tbody>
                {conditionBreakdown.map((row) => (
                  <tr key={row.condition}>
                    <td>{row.condition}</td>
                    <td>{row.records}</td>
                    <td>{row.avgReadmission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="dashboard-side-stack">
          <article className="dashboard-panel">
            <h2>Age Group Distribution</h2>

            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Age Group</th>
                    <th>Records</th>
                    <th>Readmission</th>
                  </tr>
                </thead>
                <tbody>
                  {ageGroupBreakdown.map((row) => (
                    <tr key={row.ageGroup}>
                      <td>{row.ageGroup}</td>
                      <td>{row.records}</td>
                      <td>{row.readmissionRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="dashboard-panel">
            <h2>Access Notice</h2>
            <p>
              All population data is aggregated and anonymized. No personally
              identifiable information is included in these reports.
            </p>
          </article>
        </aside>
      </section>
    </>
  );
}