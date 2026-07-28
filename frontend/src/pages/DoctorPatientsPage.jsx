import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMagnifyingGlass, FaEye } from "react-icons/fa6";

// Step 1: Dummy assigned-patients data (baad me API se aayega)
const assignedPatients = [
  { id: "PT-1001", name: "A. Johnson", age: 64, condition: "Type 2 Diabetes", lastVisit: "24 Jul 2026", riskLevel: "High" },
  { id: "PT-1002", name: "M. Patel", age: 58, condition: "Hypertension", lastVisit: "22 Jul 2026", riskLevel: "Low" },
  { id: "PT-1003", name: "S. Williams", age: 71, condition: "Heart Failure", lastVisit: "20 Jul 2026", riskLevel: "High" },
  { id: "PT-1004", name: "R. Gomez", age: 49, condition: "Type 2 Diabetes", lastVisit: "18 Jul 2026", riskLevel: "Low" },
  { id: "PT-1005", name: "L. Chen", age: 66, condition: "COPD", lastVisit: "15 Jul 2026", riskLevel: "High" },
  { id: "PT-1006", name: "K. Brown", age: 54, condition: "Hypertension", lastVisit: "12 Jul 2026", riskLevel: "Low" },
];

export function DoctorPatientsPage() {
  const navigate = useNavigate();

  // Step 2: Search + filter state
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");

  // Step 3: Filtering logic — search by name/ID, filter by risk level
  const filteredPatients = useMemo(() => {
    return assignedPatients.filter((p) => {
      const matchesQuery = `${p.id} ${p.name}`.toLowerCase().includes(query.toLowerCase());
      const matchesRisk = riskFilter === "All" || p.riskLevel === riskFilter;
      return matchesQuery && matchesRisk;
    });
  }, [query, riskFilter]);

  return (
    <>
      <section className="dashboard-page-header">
        <h1>My Patients</h1>
        <p>Patients currently assigned to your care. You cannot access records outside this scope.</p>
      </section>

      <section className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header-row">
          <div>
            <h2>Assigned Patient List</h2>
            <p>{filteredPatients.length} patient(s) found</p>
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

            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              <option>All</option>
              <option>High</option>
              <option>Low</option>
            </select>
          </div>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Condition</th>
                <th>Last Visit</th>
                <th>Risk Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.age}</td>
                  <td>{p.condition}</td>
                  <td>{p.lastVisit}</td>
                  <td>
                    <span className={`risk-pill ${p.riskLevel === "High" ? "high" : "low"}`}>
                      {p.riskLevel}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => navigate(`/app/doctor/patients/${p.id}`)}
                    >
                      <FaEye /> View
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "24px" }}>
                    No patients match your search.
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