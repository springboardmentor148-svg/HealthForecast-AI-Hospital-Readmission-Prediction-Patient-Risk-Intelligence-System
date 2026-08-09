import { useEffect, useState } from "react";
import { FaHospitalUser, FaArrowTrendUp, FaArrowTrendDown, FaMinus } from "react-icons/fa6";
import { fetchHospitalOutcomes } from "../services/hospitalAdminApi.js";

const trendIcon = {
  up: FaArrowTrendUp,
  down: FaArrowTrendDown,
  flat: FaMinus,
};

const trendTone = {
  up: "low",
  down: "high",
  flat: "moderate",
};

export function HospitalAdminOutcomesPage() {
  const [outcomesData, setOutcomesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOutcomes() {
      try {
        setLoading(true);
        const data = await fetchHospitalOutcomes();
        setOutcomesData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadOutcomes();
  }, []);

  const handleExport = () => {
    if (!outcomesData) return;

    const headers = ["Patient ID", "Name", "Department", "Admitted", "Outcome", "Readmission Risk"];
    const rows = outcomesData.patients.map((r) => [
      r.patientId,
      r.name,
      r.department || "",
      r.admitted || "",
      r.outcome,
      r.readmissionRisk,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "patient-outcomes.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <section className="dashboard-page-header">
        <h1>Loading outcomes...</h1>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-page-header">
        <h1>Patient Outcomes</h1>
        <p style={{ color: "red" }}>{error}</p>
      </section>
    );
  }

  return (
    <>
      <section className="dashboard-page-header">
        <h1>Patient Outcomes</h1>
        <p>
          Track recovery trends, discharge outcomes, and readmission risk across
          every department in the hospital.
        </p>
      </section>

      <section className="dashboard-card-grid">
        {outcomesData.summary.map((card) => (
          <article key={card.label} className="dashboard-metric-card">
            <div className="metric-icon">
              <FaHospitalUser />
            </div>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-table-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="panel-header-row">
            <div>
              <h2>Patient Outcome Tracking</h2>
              <p>Latest discharged and monitored patients across departments</p>
            </div>

            <div className="dashboard-inline-actions">
              <button type="button" className="secondary-button" onClick={handleExport}>
                Export
              </button>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Admitted</th>
                  <th>Outcome</th>
                  <th>Trend</th>
                  <th>Readmission Risk</th>
                </tr>
              </thead>

              <tbody>
                {outcomesData.patients.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No patients found yet.</td>
                  </tr>
                ) : (
                  outcomesData.patients.map((row) => {
                    const TrendIcon = trendIcon[row.trend];
                    return (
                      <tr key={row.patientId}>
                        <td>{row.patientId}</td>
                        <td>{row.name}</td>
                        <td>{row.department || "—"}</td>
                        <td>{row.admitted || "—"}</td>
                        <td>{row.outcome}</td>
                        <td>
                          <span className={`risk-pill ${trendTone[row.trend]}`}>
                            <TrendIcon />
                          </span>
                        </td>
                        <td>
                          <span
                            className={`risk-pill ${
                              row.readmissionRisk === "Low"
                                ? "low"
                                : row.readmissionRisk === "High"
                                ? "high"
                                : "moderate"
                            }`}
                          >
                            {row.readmissionRisk}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </>
  );
}