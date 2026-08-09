import { useEffect, useState } from "react";
import { FaUsers, FaHeartPulse, FaChartPie, FaFileExport } from "react-icons/fa6";
import { fetchPopulationStats } from "../services/researchApi";

export function ResearcherPopulationHealthPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchPopulationStats()
      .then(setData)
      .catch(() => setError("Could not load population health data."))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    if (!data) return;
    const headers = ["Condition", "Records", "Avg. Readmission Rate"];
    const rows = data.conditionBreakdown.map((r) => [r.condition, r.records, r.avgReadmission]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "population-health-condition-breakdown.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return <p style={{ padding: "24px" }}>Loading population health data...</p>;
  if (error) return <p style={{ padding: "24px", color: "crimson" }}>{error}</p>;

  const populationStats = [
    { label: "Total Anonymized Records", value: data.totalAnonymizedRecords, icon: FaUsers },
    { label: "Chronic Condition Records", value: data.chronicConditionRecords, icon: FaHeartPulse },
    { label: "Avg. Age Group", value: data.avgAgeGroup, icon: FaChartPie },
  ];

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
              <button type="button" className="secondary-button" onClick={handleExport}>
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
                {data.conditionBreakdown.map((row) => (
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
                  {data.ageGroupBreakdown.map((row) => (
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