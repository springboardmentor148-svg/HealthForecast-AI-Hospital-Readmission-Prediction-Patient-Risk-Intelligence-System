import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FaHospital,
  FaUserGroup,
  FaChartLine,
  FaBedPulse,
  FaCircleCheck,
  FaTriangleExclamation,
} from "react-icons/fa6";
import { fetchHospitalOverview } from "../services/hospitalAdminApi.js";

export function HospitalAdminOverviewPage() {
  const { user } = useOutletContext();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOverview() {
      try {
        setLoading(true);
        const data = await fetchHospitalOverview();
        setOverview(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  const handleExportDepartmentReport = () => {
    if (!overview) return;

    const headers = ["Department", "Readmission Rate", "Outcome", "Status"];
    const rows = overview.departmentPerformance.map((r) => [
      r.name,
      r.readmissionRate,
      r.outcome,
      r.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "department-performance.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <section className="dashboard-page-header">
        <h1>Loading overview...</h1>
      </section>
    );
  }

  if (error) {
    return (
      <section className="dashboard-page-header">
        <h1>Overview</h1>
        <p style={{ color: "red" }}>{error}</p>
      </section>
    );
  }

  const hospitalStats = [
    { label: "Total Patients", value: overview.totalPatients, icon: FaUserGroup },
    { label: "Readmission Rate", value: overview.readmissionRate, icon: FaChartLine },
    { label: "Bed Occupancy", value: overview.bedOccupancy, icon: FaBedPulse },
    { label: "Departments Monitored", value: overview.departmentsMonitored, icon: FaHospital },
  ];

  return (
    <>
      <section className="dashboard-hero-card">
        <div>
          <span className="dashboard-eyebrow">Hospital Operations</span>
          <h1>Welcome{user?.fullName ? `, ${user.fullName}` : ""}</h1>
          <p>
            Monitor hospital-wide performance, patient outcomes, and resource
            utilization across departments.
          </p>
        </div>

        <div className="dashboard-hero-metric">
          <strong>LIVE</strong>
          <span>Hospital Overview</span>
        </div>
      </section>

      <section className="dashboard-card-grid">
        {hospitalStats.map((card) => {
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
              <h2>Department Performance</h2>
              <p>Readmission rate and outcome status by department</p>
            </div>

            <div className="dashboard-inline-actions">
              <button type="button" className="secondary-button" onClick={handleExportDepartmentReport}>
                Export
              </button>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Readmission Rate</th>
                  <th>Outcome</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {overview.departmentPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No departments added yet.</td>
                  </tr>
                ) : (
                  overview.departmentPerformance.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.readmissionRate}</td>
                      <td>{row.outcome}</td>
                      <td>
                        <span className={`risk-pill ${row.status === "Low" ? "low" : "high"}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="dashboard-side-stack">
          <article className="dashboard-panel">
            <h2>Alerts</h2>

            <ul className="notification-list">
              {overview.alerts.map((entry, index) => (
                <li key={index} className="notification-item">
                  <span className={`notification-icon tone-${entry.tone}`}>
                    {entry.tone === "warning" ? <FaTriangleExclamation /> : <FaCircleCheck />}
                  </span>
                  <div className="notification-body">
                    <p>{entry.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </section>
    </>
  );
}