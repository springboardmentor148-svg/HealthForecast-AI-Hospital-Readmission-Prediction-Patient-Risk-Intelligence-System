import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMagnifyingGlass, FaUserInjured } from "react-icons/fa6";
import { fetchPatients } from "../services/patientsApi.js";

export function DoctorPatientsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPatients() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchPatients();
        if (isMounted) {
          setPatients(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Failed to load patients.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPatients();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const term = searchTerm.toLowerCase();
    return (
      patient.name.toLowerCase().includes(term) ||
      patient.condition.toLowerCase().includes(term) ||
      patient.patientId.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <section className="dashboard-hero-card">
        <div>
          <span className="dashboard-eyebrow">My Patients</span>
          <h1>Assigned Patients</h1>
          <p>{patients.length} patients currently under your care</p>
        </div>
      </section>

      <section className="dashboard-panel dashboard-panel-wide">
        <div className="panel-header-row">
          <div>
            <h2>Patient Directory</h2>
            <p>Search and open a patient's full record</p>
          </div>
          <div className="dashboard-toolbar">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, condition, or patient ID..."
            />
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/app/doctor/patients/new")}
            >
              + Add Patient
            </button>
          </div>
        </div>

        {isLoading && <p>Loading patients...</p>}

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
                  <th>Patient</th>
                  <th>Age / Gender</th>
                  <th>Condition</th>
                  <th>Risk Level</th>
                  <th>Readmission Prob.</th>
                  <th>Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 && (
                  <tr>
                    <td colSpan={6}>No patients found.</td>
                  </tr>
                )}
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.patientId}
                    onClick={() => navigate(`/app/doctor/patients/${patient.patientId}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <FaUserInjured style={{ marginRight: "6px" }} />
                      {patient.name} <span style={{ opacity: 0.6 }}>({patient.patientId})</span>
                    </td>
                    <td>
                      {patient.age} / {patient.gender}
                    </td>
                    <td>{patient.condition}</td>
                    <td>
                      <span className={`risk-pill ${patient.riskLevel === "High" ? "high" : "low"}`}>
                        {patient.riskLevel}
                      </span>
                    </td>
                    <td>{patient.readmissionProbability}</td>
                    <td>{patient.lastVisit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}