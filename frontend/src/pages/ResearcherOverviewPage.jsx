import { useOutletContext } from "react-router-dom";
import {
  FaDatabase,
  FaFlask,
  FaChartLine,
  FaFileExport,
} from "react-icons/fa6";

const researchStats = [
  { label: "Anonymized Records", value: "18,940", icon: FaDatabase },
  { label: "Active Studies", value: "5", icon: FaFlask },
  { label: "Avg. Treatment Effectiveness", value: "82.1%", icon: FaChartLine },
  { label: "Datasets Exported", value: "24", icon: FaFileExport },
];

const treatmentEffectiveness = [
  { treatment: "Metformin regimen", cohortSize: "1,204", effectiveness: "88%" },
  { treatment: "Insulin adjustment", cohortSize: "876", effectiveness: "79%" },
  { treatment: "Combined therapy", cohortSize: "542", effectiveness: "84%" },
];

export function ResearcherOverviewPage() {
  const { user } = useOutletContext();

  return (
    <>
      <section className="dashboard-hero-card">
        <div>
          <span className="dashboard-eyebrow">Research & Analytics</span>
          <h1>Welcome{user?.fullName ? `, ${user.fullName}` : ""}</h1>
          <p>
            Explore anonymized patient datasets, treatment effectiveness
            trends, and population health insights.
          </p>
        </div>

        <div className="dashboard-hero-metric">
          <strong>ANON</strong>
          <span>Data Access Only</span>
        </div>
      </section>

      <section className="dashboard-card-grid">
        {researchStats.map((card) => {
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
              <h2>Treatment Effectiveness</h2>
              <p>Aggregated outcomes across active research cohorts</p>
            </div>

            <div className="dashboard-inline-actions">
              <button type="button" className="secondary-button">
                Export Dataset
              </button>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Treatment</th>
                  <th>Cohort Size</th>
                  <th>Effectiveness</th>
                </tr>
              </thead>

              <tbody>
                {treatmentEffectiveness.map((row) => (
                  <tr key={row.treatment}>
                    <td>{row.treatment}</td>
                    <td>{row.cohortSize}</td>
                    <td>{row.effectiveness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="dashboard-side-stack">
          <article className="dashboard-panel">
            <h2>Access Notice</h2>
            <p>
              All patient data shown here is anonymized. Personally
              identifiable information is not available to research accounts.
            </p>
          </article>
        </aside>
      </section>
    </>
  );
}