import { useNavigate, useOutletContext } from "react-router-dom";

import {
  FaBell,
  FaChartLine,
  FaChartPie,
  FaClipboardList,
  FaRobot,
  FaUsers,
  FaTriangleExclamation,
  FaFileWaveform,
  FaChevronRight,
} from "react-icons/fa6";

const dashboardCards = [
  { label: "Assigned Patients", value: "42", icon: FaUsers },
  { label: "Predictions Today", value: "9", icon: FaChartLine },
  { label: "High Risk Patients", value: "6", icon: FaBell },
  { label: "Low Risk Patients", value: "36", icon: FaClipboardList },
  { label: "Model Accuracy", value: "92.4%", icon: FaChartPie },
  { label: "Average Confidence", value: "87.2%", icon: FaRobot },
];

const recentPredictions = [
  {
    id: "P-101",
    name: "A. Johnson",
    prediction: "Readmission",
    confidence: "91%",
    risk: "High",
    date: "Today, 08:45 AM",
  },
  {
    id: "P-102",
    name: "M. Patel",
    prediction: "No Readmission",
    confidence: "84%",
    risk: "Low",
    date: "Today, 09:10 AM",
  },
  {
    id: "P-103",
    name: "S. Williams",
    prediction: "Readmission",
    confidence: "79%",
    risk: "High",
    date: "Today, 10:05 AM",
  },
];

const notifications = [
  {
    icon: FaTriangleExclamation,
    tone: "warning",
    text: "3 of your patients flagged for discharge planning review this morning.",
    time: "10 min ago",
  },
  {
    icon: FaChartLine,
    tone: "info",
    text: "Model accuracy improved to 92.4% after last night's retraining run.",
    time: "2 hr ago",
  },
  {
    icon: FaClipboardList,
    tone: "neutral",
    text: "4 new predictions were logged for your patients in the last hour.",
    time: "Just now",
  },
];

export function DoctorOverviewPage() {
  const navigate = useNavigate();
  const { user } = useOutletContext();

  const quickActions = [
    { label: "View My Patients", icon: FaUsers, path: "/app/doctor/patients" },
    { label: "Risk Predictions", icon: FaRobot, path: "/app/doctor/predictions" },
    { label: "Care Recommendations", icon: FaClipboardList, path: "/app/doctor/care-recommendations" },
    { label: "Reports", icon: FaFileWaveform, path: "/app/doctor/reports" },
  ];

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
                {recentPredictions.map((row) => (
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
              </tbody>
            </table>
          </div>
        </article>

        <aside className="dashboard-side-stack">
          <article className="dashboard-panel">
            <h2>Notifications</h2>

            <ul className="notification-list">
              {notifications.map((note, index) => {
                const Icon = note.icon;

                return (
                  <li key={index} className="notification-item">
                    <span className={`notification-icon tone-${note.tone}`}>
                      <Icon />
                    </span>
                    <div className="notification-body">
                      <p>{note.text}</p>
                      <span className="notification-time">{note.time}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
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
  );
}