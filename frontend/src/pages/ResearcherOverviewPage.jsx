import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FaDatabase,
  FaFlask,
  FaChartLine,
  FaFileExport,
} from "react-icons/fa6";
import { fetchOverviewStats } from "../services/researchApi";

export function ResearcherOverviewPage() {
  const { user } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchOverviewStats()
      .then(setData)
      .catch(() => setError("Could not load overview data."))
      .finally(() => setLoading(false));
  }, []);

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

      {loading && <p style={{ padding: "24px" }}>Loading overview...</p>}
      {error && <p style={{ padding: "24px", color: "crimson" }}>{error}</p>}

      {data && (
        <>
          <section className="dashboard-card-grid">
            {[
              { label: "Anonymized Records", value: data.anonymizedRecords, icon: FaDatabase },
              { label: "Active Studies", value: data.activeStudies, icon: FaFlask },
              { label: "Avg. Treatment Effectiveness", value: data.avgTreatmentEffectiveness, icon: FaChartLine },
              { label: "Datasets Exported", value: data.datasetsExported, icon: FaFileExport },
            ].map((card) => {
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
                    {data.treatmentEffectiveness.length === 0 && (
                      <tr>
                        <td colSpan={3}>No treatment records logged yet.</td>
                      </tr>
                    )}
                    {data.treatmentEffectiveness.map((row) => (
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
      )}
    </>
  );
}