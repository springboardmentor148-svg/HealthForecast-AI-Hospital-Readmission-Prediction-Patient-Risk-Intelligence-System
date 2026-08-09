import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import {
  FaBell,
  FaChartLine,
  FaChartPie,
  FaClipboardList,
  FaRobot,
  FaUsers,
  FaFileWaveform,
  FaChevronRight,
} from "react-icons/fa6";
import { fetchDoctorDashboardStats } from "../services/dashboardApi.js";
import { fetchDoctorNotifications } from "../services/notificationsApi.js";

export function DoctorOverviewPage() {
  const navigate = useNavigate();
  const { user } = useOutletContext();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchDoctorDashboardStats();
        if (isMounted) {
          setStats(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Failed to load dashboard stats.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    async function loadNotifications() {
      setNotifLoading(true);
      try {
        const data = await fetchDoctorNotifications();
        if (isMounted) {
          setNotifications(data);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        if (isMounted) {
          setNotifLoading(false);
        }
      }
    }

    loadStats();
    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const quickActions = [
    { label: "View My Patients", icon: FaUsers, path: "/app/doctor/patients" },
    { label: "Risk Predictions", icon: FaRobot, path: "/app/doctor/predictions" },
    { label: "Care Recommendations", icon: FaClipboardList, path: "/app/doctor/care-recommendations" },
    { label: "Reports", icon: FaFileWaveform, path: "/app/doctor/reports" },
  ];

  const dashboardCards = stats
    ? [
        { label: "Assigned Patients", value: String(stats.assignedPatients), icon: FaUsers },
        { label: "Predictions Today", value: String(stats.predictionsToday), icon: FaChartLine },
        { label: "High Risk Patients", value: String(stats.highRiskPatients), icon: FaBell },
        { label: "Low Risk Patients", value: String(stats.lowRiskPatients), icon: FaClipboardList },
        { label: "Model Accuracy", value: stats.modelAccuracy, icon: FaChartPie },
        { label: "Average Confidence", value: stats.averageConfidence, icon: FaRobot },
      ]
    : [];

  return (
    <>
      <section className="dashboard-hero-card">
        <div>
          <span className="dashboard-eyebrow">Doctor Dashboard</span>

          <h1>
            Welcome Back
            {user?.fullName ? `, ${user.fullName}` : ""}
          </h1>

          <p>
            Monitor your assigned patients' readmission risk, review AI
            predictions, and support discharge planning.
          </p>
        </div>

        <div className="dashboard-hero-metric">
          <strong>LIVE</strong>
          <span>Model Ready</span>
        </div>
      </section>

      {isLoading && <p>Loading dashboard...</p>}

      {!isLoading && error && (
        <p className="access-error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && stats && (
        <>
          <section className="dashboard-card-grid">
            {dashboardCards.map((card) => {
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
                  <h2>Recent Predictions</h2>
                  <p>Latest scored patients from your assigned list</p>
                </div>

                <div className="dashboard-inline-actions">
                  <button type="button" className="secondary-button">
                    Filter
                  </button>
                  <button type="button" className="secondary-button">
                    Export
                  </button>
                </div>
              </div>

              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Patient ID</th>
                      <th>Patient Name</th>
                      <th>Prediction</th>
                      <th>Confidence</th>
                      <th>Risk Level</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {stats.recentPredictions.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.name}</td>
                        <td>{row.prediction}</td>
                        <td>{row.confidence}</td>
                        <td>
                          <span
                            className={`risk-pill ${
                              row.risk === "High" ? "high" : "low"
                            }`}
                          >
                            {row.risk}
                          </span>
                        </td>
                        <td>{row.date}</td>
                      </tr>
                    ))}

                    {stats.recentPredictions.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "24px" }}>
                          No predictions yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <aside className="dashboard-side-stack">
              <article className="dashboard-panel">
                <h2>Notifications</h2>

                {notifLoading && <p>Loading notifications...</p>}

                {!notifLoading && (
                  <ul className="notification-list">
                    {notifications.length === 0 && (
                      <li className="notification-item">
                        <div className="notification-body">
                          <p>No new notifications.</p>
                        </div>
                      </li>
                    )}
                    {notifications.map((note) => (
                      <li key={note.id} className="notification-item">
                        <span className="notification-icon tone-info">
                          <FaBell />
                        </span>
                        <div className="notification-body">
                          <p>{note.text}</p>
                          <span className="notification-time">{note.time}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="dashboard-panel">
                <h2>Quick Actions</h2>

                <div className="quick-action-list">
                  {quickActions.map((action) => {
                    const Icon = action.icon;

                    return (
                      <button
                        key={action.path}
                        type="button"
                        className="quick-action-row"
                        onClick={() => navigate(action.path)}
                      >
                        <span className="quick-action-icon">
                          <Icon />
                        </span>
                        <span className="quick-action-label">{action.label}</span>
                        <FaChevronRight className="quick-action-arrow" />
                      </button>
                    );
                  })}
                </div>
              </article>
            </aside>
          </section>
        </>
      )}
    </>
  );
}