import { FaUsers, FaHeartPulse, FaChartPie, FaDownload } from "react-icons/fa6";

// Dummy data — population-level health trends (baad me API se aayega)
const populationStats = [
  { label: "Total Patients Tracked", value: "2,184", icon: FaUsers },
  { label: "Chronic Condition Patients", value: "938", icon: FaHeartPulse },
  { label: "Avg. Age", value: "58.4 yrs", icon: FaChartPie },
];

const conditionBreakdown = [
  { condition: "Type 2 Diabetes", patients: 412, avgReadmission: "9.1%" },
  { condition: "Hypertension", patients: 356, avgReadmission: "6.4%" },
  { condition: "Heart Failure", patients: 198, avgReadmission: "13.2%" },
  { condition: "COPD", patients: 164, avgReadmission: "10.8%" },
  { condition: "Chronic Kidney Disease", patients: 121, avgReadmission: "12.5%" },
];

const reports = [
  { title: "Q3 2026 Population Health Summary", period: "Jul - Sep 2026", status: "Ready" },
  { title: "Chronic Disease Prevalence Report", period: "Jan - Jun 2026", status: "Ready" },
  { title: "Age Group Risk Distribution", period: "2026 YTD", status: "Ready" },
];

export function HospitalAdminPopulationHealthPage() {
  return (
    <>
      <section className="dashboard-page-header">
        <h1>Population Health Reports</h1>
        <p>Hospital-wide health trends and chronic condition patterns across your patient population.</p>
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
              <p>Patient count and readmission rate by chronic condition</p>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Condition</th>
                  <th>Patients</th>
                  <th>Avg. Readmission Rate</th>
                </tr>
              </thead>
              <tbody>
                {conditionBreakdown.map((row) => (
                  <tr key={row.condition}>
                    <td>{row.condition}</td>
                    <td>{row.patients}</td>
                    <td>{row.avgReadmission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="dashboard-side-stack">
          <article className="dashboard-panel">
            <h2>Available Reports</h2>

            <ul className="notification-list">
              {reports.map((report, index) => (
                <li key={index} className="notification-item">
                  <span className="notification-icon tone-info">
                    <FaChartPie />
                  </span>
                  <div className="notification-body" style={{ flex: 1 }}>
                    <p>{report.title}</p>
                    <span className="notification-time">{report.period}</span>
                  </div>
                  <button type="button" className="icon-button" aria-label={`Download ${report.title}`}>
                    <FaDownload />
                  </button>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </section>
    </>
  );
}