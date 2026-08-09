import { useEffect, useState } from "react";
import { FaFlask } from "react-icons/fa6";
import { fetchTreatmentEffectiveness } from "../services/hospitalAdminApi.js";

const statusTone = { Good: "low", Moderate: "moderate", "Needs Review": "high", "No Data": "moderate" };

export function HospitalAdminTreatmentEffectivenessPage() {
  const [effectivenessData, setEffectivenessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");

  useEffect(() => {
    async function loadEffectiveness() {
      try {
        setLoading(true);
        const data = await fetchTreatmentEffectiveness();
        setEffectivenessData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadEffectiveness();
  }, []);

  if (loading) {
    return (
      <section className="dashboard-page-header">
        <h1>Loading treatment effectiveness...</h1>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-page-header">
        <h1>Treatment Effectiveness</h1>
        <p style={{ color: "red" }}>{error}</p>
      </section>
    );
  }

  const filteredRows =
    departmentFilter === "All"
      ? effectivenessData.departmentEffectiveness
      : effectivenessData.departmentEffectiveness.filter(
          (r) => r.department === departmentFilter
        );

  return (
    <>
      <section className="dashboard-page-header">
        <h1>Treatment Effectiveness</h1>
        <p>Hospital-wide treatment outcomes and medication adherence across departments.</p>
      </section>

      <section className="dashboard-card-grid">
        {effectivenessData.summary.map((card) => (
          <article key={card.label} className="dashboard-metric-card">
            <div className="metric-icon">
              <FaFlask />
            </div>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header-row">
          <div>
            <h2>Department-wise Treatment Outcomes</h2>
            <p>{filteredRows.length} department(s) shown</p>
          </div>

          <div className="dashboard-toolbar">
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option>All</option>
              {effectivenessData.departmentEffectiveness.map((d) => (
                <option key={d.department}>{d.department}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Treatments Reviewed</th>
                <th>Good Response Rate</th>
                <th>Avg. Medication Adherence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5}>No departments added yet.</td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.department}>
                    <td>{row.department}</td>
                    <td>{row.treatmentsReviewed}</td>
                    <td>{row.goodResponse}</td>
                    <td>{row.avgAdherence}</td>
                    <td>
                      <span className={`risk-pill ${statusTone[row.status]}`}>{row.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}