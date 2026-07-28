import { useMemo, useState } from "react";
import { FaMagnifyingGlass, FaFlask } from "react-icons/fa6";

// Dummy data — apne assigned patients ke treatment outcomes (baad me API se aayega)
const treatmentRecords = [
  {
    id: "PT-1001",
    name: "A. Johnson",
    treatment: "Metformin + Insulin Therapy",
    startDate: "10 Jun 2026",
    effectiveness: "Good",
    recoveryTrend: "Improving",
    adherence: "92%",
  },
  {
    id: "PT-1002",
    name: "M. Patel",
    treatment: "ACE Inhibitors",
    startDate: "02 Jul 2026",
    effectiveness: "Good",
    recoveryTrend: "Stable",
    adherence: "88%",
  },
  {
    id: "PT-1003",
    name: "S. Williams",
    treatment: "Beta Blockers + Diuretics",
    startDate: "15 May 2026",
    effectiveness: "Moderate",
    recoveryTrend: "Slow Improvement",
    adherence: "74%",
  },
  {
    id: "PT-1004",
    name: "R. Gomez",
    treatment: "Metformin",
    startDate: "20 Jun 2026",
    effectiveness: "Good",
    recoveryTrend: "Improving",
    adherence: "95%",
  },
  {
    id: "PT-1005",
    name: "L. Chen",
    treatment: "Bronchodilator Therapy",
    startDate: "05 Jul 2026",
    effectiveness: "Poor",
    recoveryTrend: "Declining",
    adherence: "58%",
  },
];

const effectivenessSummary = [
  { label: "Total Evaluated", value: "5", tone: "low" },
  { label: "Good Response", value: "3", tone: "low" },
  { label: "Needs Review", value: "2", tone: "high" },
];

const effectivenessTone = {
  Good: "low",
  Moderate: "moderate",
  Poor: "high",
};

export function DoctorTreatmentEffectivenessPage() {
  const [query, setQuery] = useState("");
  const [effectivenessFilter, setEffectivenessFilter] = useState("All");

  const filteredRecords = useMemo(() => {
    return treatmentRecords.filter((r) => {
      const matchesQuery = `${r.id} ${r.name}`.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        effectivenessFilter === "All" || r.effectiveness === effectivenessFilter;
      return matchesQuery && matchesFilter;
    });
  }, [query, effectivenessFilter]);

  return (
    <>
      <section className="dashboard-page-header">
        <h1>Treatment Effectiveness</h1>
        <p>Review how your assigned patients are responding to their current treatment plans.</p>
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
            <h2>Patient Treatment Outcomes</h2>
            <p>{filteredRecords.length} record(s) found</p>
          </div>

          <div className="dashboard-toolbar">
            <div className="search-input-wrap">
              <FaMagnifyingGlass />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or patient ID"
              />
            </div>

            <select value={effectivenessFilter} onChange={(e) => setEffectivenessFilter(e.target.value)}>
              <option>All</option>
              <option>Good</option>
              <option>Moderate</option>
              <option>Poor</option>
            </select>
          </div>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Treatment Plan</th>
                <th>Start Date</th>
                <th>Effectiveness</th>
                <th>Recovery Trend</th>
                <th>Medication Adherence</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.treatment}</td>
                  <td>{r.startDate}</td>
                  <td>
                    <span className={`risk-pill ${effectivenessTone[r.effectiveness]}`}>
                      {r.effectiveness}
                    </span>
                  </td>
                  <td>{r.recoveryTrend}</td>
                  <td>{r.adherence}</td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "24px" }}>
                    No treatment records match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}