import { useNavigate, useOutletContext } from "react-router-dom";
import {
  FaUsers,
  FaUserDoctor,
  FaClipboardList,
  FaShieldHalved,
  FaCircleCheck,
  FaTriangleExclamation,
} from "react-icons/fa6";

const platformStats = [
  { label: "Total Users", value: "42", icon: FaUsers },
  { label: "Active Doctors", value: "31", icon: FaUserDoctor },
  { label: "Predictions This Week", value: "612", icon: FaClipboardList },
  { label: "System Uptime", value: "99.9%", icon: FaShieldHalved },
];

const recentUsers = [
  { name: "Dr. Sarah Mitchell", role: "Doctor", status: "Active", lastActive: "2 min ago" },
  { name: "Dr. James Cole", role: "Doctor", status: "Active", lastActive: "18 min ago" },
  { name: "Dr. Priya Nair", role: "Doctor", status: "Inactive", lastActive: "3 days ago" },
  { name: "Alex Carter", role: "Administrator", status: "Active", lastActive: "Just now" },
];

const auditLog = [
  { icon: FaCircleCheck, tone: "info", text: "Alex Carter updated system settings.", time: "10 min ago" },
  { icon: FaTriangleExclamation, tone: "warning", text: "Failed login attempt for dr.cole@hospital.org.", time: "1 hr ago" },
  { icon: FaCircleCheck, tone: "neutral", text: "New doctor account created: Dr. Priya Nair.", time: "Yesterday" },
];

export function AdminOverviewPage() {
  const navigate = useNavigate();
  const { user } = useOutletContext();

  return (
    <>
      <section className="dashboard-hero-card">
        <div>
          <span className="dashboard-eyebrow">System Administration</span>
          <h1>
            Welcome{user?.fullName ? `, ${user.fullName}` : ""}
          </h1>
          <p>
            Manage users, monitor platform activity, and review audit logs
            across HealthForecastAI.
          </p>
        </div>

        <div className="dashboard-hero-metric">
          <strong>ADMIN</strong>
          <span>Full Access</span>
        </div>
      </section>

      <section className="dashboard-card-grid">
        {platformStats.map((card) => {
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
              <h2>User Management</h2>
              <p>Doctors and administrators with platform access</p>
            </div>

            <div className="dashboard-inline-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => navigate("/app/admin/users")}
              >
                Invite User
              </button>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Active</th>
                </tr>
              </thead>

              <tbody>
                {recentUsers.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.role}</td>
                    <td>
                      <span
                        className={`risk-pill ${
                          row.status === "Active" ? "low" : "high"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td>{row.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="dashboard-side-stack">
          <article className="dashboard-panel">
            <h2>Audit Log</h2>

            <ul className="notification-list">
              {auditLog.map((entry, index) => {
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