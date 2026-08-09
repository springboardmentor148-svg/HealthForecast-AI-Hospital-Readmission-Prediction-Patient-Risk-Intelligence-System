import { useEffect, useMemo, useState } from "react";
import { FaMagnifyingGlass, FaFlask } from "react-icons/fa6";
import { fetchTreatments, fetchTreatmentSummary } from "../services/treatmentsApi.js";

const effectivenessTone = {
  Good: "low",
  Moderate: "moderate",
  Poor: "high",
};

export function DoctorTreatmentEffectivenessPage() {
  const [query, setQuery] = useState("");
  const [effectivenessFilter, setEffectivenessFilter] = useState("All");
  const [treatmentRecords, setTreatmentRecords] = useState([]);
  const [summary, setSummary] = useState({ totalEvaluated: 0, goodResponse: 0, needsReview: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [records, summaryData] = await Promise.all([
          fetchTreatments(),
          fetchTreatmentSummary(),
        ]);
        if (isMounted) {
          setTreatmentRecords(records);
          setSummary(summaryData);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Failed to load treatment data.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const effectivenessSummary = [
    { label: "Total Evaluated", value: String(summary.totalEvaluated), tone: "low" },
    { label: "Good Response", value: String(summary.goodResponse), tone: "low" },
    { label: "Needs Review", value: String(summary.needsReview), tone: "high" },
  ];

  const filteredRecords = useMemo(() => {
    return treatmentRecords.filter((r) => {
      const matchesQuery = `${r.patientId} ${r.name}`.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        effectivenessFilter === "All" || r.effectiveness === effectivenessFilter;
      return matchesQuery && matchesFilter;
    });
  }, [query, effectivenessFilter, treatmentRecords]);

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

        {isLoading && <p>Loading treatment records...</p>}

        {!isLoading && error && (
          <p className="access-error" role="alert">
            {error}
          </p>
        )}

        {!isLoading && !error && (
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
                    <td>{r.patientId}</td>
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
        )}
      </section>
    </>
  );
}