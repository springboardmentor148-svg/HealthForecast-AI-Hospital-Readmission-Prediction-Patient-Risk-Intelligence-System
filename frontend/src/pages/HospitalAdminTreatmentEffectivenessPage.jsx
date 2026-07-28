import { useState } from "react";
import { FaFlask } from "react-icons/fa6";

// Dummy data — department-wise treatment effectiveness (baad me API se aayega)
const effectivenessSummary = [
  { label: "Treatments Evaluated", value: "1,842", tone: "low" },
  { label: "Good Response Rate", value: "78%", tone: "low" },
  { label: "Needs Review", value: "156", tone: "high" },
];

const departmentEffectiveness = [
  { department: "Cardiology", treatmentsReviewed: 486, goodResponse: "82%", avgAdherence: "88%", status: "Good" },
  { department: "Endocrinology", treatmentsReviewed: 398, goodResponse: "68%", avgAdherence: "74%", status: "Needs Review" },
  { department: "General Surgery", treatmentsReviewed: 512, goodResponse: "85%", avgAdherence: "91%", status: "Good" },
  { department: "Neurology", treatmentsReviewed: 274, goodResponse: "71%", avgAdherence: "79%", status: "Moderate" },
  { department: "Emergency Medicine", treatmentsReviewed: 172, goodResponse: "76%", avgAdherence: "80%", status: "Good" },
];

const statusTone = { Good: "low", Moderate: "moderate", "Needs Review": "high" };

export function HospitalAdminTreatmentEffectivenessPage() {
  const [departmentFilter, setDepartmentFilter] = useState("All");

  const filteredRows =
    departmentFilter === "All"
      ? departmentEffectiveness
      : departmentEffectiveness.filter((r) => r.department === departmentFilter);

  return (
    <>
      <section className="dashboard-page-header">
        <h1>Treatment Effectiveness</h1>
        <p>Hospital-wide treatment outcomes and medication adherence across departments.</p>
      </section>

      <section className="dashboard-card-grid">
        {effectivenessSummary.map((card) => (
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
              {departmentEffectiveness.map((d) => (
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
              {filteredRows.map((row) => (
                <tr key={row.department}>
                  <td>{row.department}</td>
                  <td>{row.treatmentsReviewed}</td>
                  <td>{row.goodResponse}</td>
                  <td>{row.avgAdherence}</td>
                  <td>
                    <span className={`risk-pill ${statusTone[row.status]}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}