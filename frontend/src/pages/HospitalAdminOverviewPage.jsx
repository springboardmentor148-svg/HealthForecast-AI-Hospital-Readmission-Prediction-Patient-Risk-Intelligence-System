import { useOutletContext } from "react-router-dom";
import {
  FaHospital,
  FaUserGroup,
  FaChartLine,
  FaBedPulse,
  FaCircleCheck,
  FaTriangleExclamation,
} from "react-icons/fa6";

const hospitalStats = [
  { label: "Total Patients", value: "2,184", icon: FaUserGroup },
  { label: "Readmission Rate", value: "8.4%", icon: FaChartLine },
  { label: "Bed Occupancy", value: "76%", icon: FaBedPulse },
  { label: "Departments Monitored", value: "12", icon: FaHospital },
];

const departmentReports = [
  { name: "Cardiology", readmission: "6.2%", outcome: "Good", status: "Low" },
  { name: "Endocrinology", readmission: "11.8%", outcome: "Needs review", status: "High" },
  { name: "General Surgery", readmission: "7.1%", outcome: "Good", status: "Low" },
];

const alerts = [
  { icon: FaTriangleExclamation, tone: "warning", text: "Endocrinology readmission rate above target threshold.", time: "1 hr ago" },
  { icon: FaCircleCheck, tone: "info", text: "Weekly hospital performance report generated.", time: "3 hr ago" },
];

export function HospitalAdminOverviewPage() {
  const { user } = useOutletContext();

  const handleExportDepartmentReport = () => {
    const headers = ["Department", "Readmission Rate", "Outcome", "Status"];
    const rows = departmentReports.map((r) => [r.name, r.readmission, r.outcome, r.status]);

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
                {departmentReports.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.readmission}</td>
                    <td>{row.outcome}</td>
                    <td>
                      <span className={`risk-pill ${row.status === "Low" ? "low" : "high"}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="dashboard-side-stack">
          <article className="dashboard-panel">
            <h2>Alerts</h2>

            <ul className="notification-list">
              {alerts.map((entry, index) => {
                const Icon = entry.icon;
                return (
                  <li key={index} className="notification-item">
                    <span className={`notification-icon tone-${entry.tone}`}>
                      <Icon />
                    </span>
                    <div className="notification-body">
                      <p>{entry.text}</p>
                      <span className="notification-time">{entry.time}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>
        </aside>
      </section>
    </>
  );
}