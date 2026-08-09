import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  FaUsers,
  FaUserDoctor,
  FaClipboardList,
  FaHospitalUser,
} from "react-icons/fa6";
import { fetchAdminOverview } from "../services/adminApi.js";

function formatJoined(isoString) {
  if (!isoString) return "—";
  const date = new Date(isoString);
  return date.toLocaleDateString();
}

export function AdminOverviewPage() {
  const navigate = useNavigate();
  const { user } = useOutletContext();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOverview() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchAdminOverview();
        setOverview(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  const platformStats = [
    { label: "Total Users", value: overview ? String(overview.totalUsers) : "—", icon: FaUsers },
    { label: "Active Doctors", value: overview ? String(overview.activeDoctors) : "—", icon: FaUserDoctor },
    { label: "Predictions This Week", value: overview ? String(overview.predictionsThisWeek) : "—", icon: FaClipboardList },
    { label: "Total Patients", value: overview ? String(overview.totalPatients) : "—", icon: FaHospitalUser },
  ];

  const recentUsers = overview
    ? overview.recentUsers.map((u) => ({
        name: u.fullName,
        role: u.userRole,
        status: u.isActive ? "Active" : "Inactive",
        lastActive: formatJoined(u.createdAt),
      }))
    : [];

  const recentPredictions = overview ? overview.recentPredictions : [];

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
              <strong>{loading ? "…" : card.value}</strong>
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
                  <th>Joined</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="dashboard-table-empty">Loading...</td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={4} className="dashboard-table-empty">{error}</td>
                  </tr>
                )}

                {!loading && !error && recentUsers.map((row) => (
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

                {!loading && !error && recentUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="dashboard-table-empty">No users yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="dashboard-side-stack">
          <article className="dashboard-panel">
            <h2>Recent Predictions</h2>

            <ul className="notification-list">
              {loading && <li className="dashboard-table-empty">Loading...</li>}

              {!loading && !error && recentPredictions.map((p) => (
                <li key={p.id} className="notification-item">
                  <span className={`notification-icon tone-${p.riskLevel === "High" ? "warning" : "neutral"}`}>
                    {p.riskLevel === "High" ? "!" : "✓"}
                  </span>
                  <div className="notification-body">
                    <p>{p.patientName || "Unnamed patient"} — {p.result}</p>
                    <span className="notification-time">Risk: {p.riskLevel}</span>
                  </div>
                </li>
              ))}

              {!loading && !error && recentPredictions.length === 0 && (
                <li className="dashboard-table-empty">No predictions yet.</li>
              )}
            </ul>
          </article>
        </aside>
      </section>
    </>
  );
}