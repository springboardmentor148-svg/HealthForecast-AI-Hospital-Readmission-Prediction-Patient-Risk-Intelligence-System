import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate, NavLink } from "react-router-dom";

import {
  FaArrowRightFromBracket,
  FaChartPie,
  FaClipboardList,
  FaHouseMedical,
  FaRobot,
  FaSliders,
  FaUserDoctor,
  FaFileWaveform,
  FaBars,
  FaXmark,
} from "react-icons/fa6";

import "./AppLayout.css";

import { Navigation } from "../components/Navigation.jsx";
import { Footer } from "../components/Footer.jsx";

import { clearAuthUser, readAuthUser } from "../shared/authStorage.js";

const sidebarItems = [
  { label: "Dashboard", icon: FaHouseMedical, path: "/app/dashboard" },
  { label: "Prediction", icon: FaRobot, path: "/app/prediction" },
  { label: "Prediction History", icon: FaClipboardList, path: "/app/history" },
  { label: "Reports", icon: FaFileWaveform, path: "/app/reports" },
  { label: "Profile", icon: FaUserDoctor, path: "/app/profile" },
  { label: "Settings", icon: FaSliders, path: "/app/settings" },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setUser(readAuthUser());
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuthUser();
    setShowLogoutModal(false);
    navigate("/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="dashboard-shell">
      <Navigation mode="private" />

      <button className="mobile-menu-button" onClick={() => setSidebarOpen(true)}>
        <FaBars />
      </button>

      <div className="dashboard-layout">
        <aside className={`dashboard-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
          <button className="sidebar-close" onClick={closeSidebar}>
            <FaXmark />
          </button>


          <nav className="sidebar-nav" aria-label="Dashboard Navigation">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) => (isActive ? "is-active" : "")}
                >
                  <Icon />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <button
            type="button"
            className="sidebar-logout"
            onClick={() => setShowLogoutModal(true)}
          >
            <FaArrowRightFromBracket />
            Logout
          </button>
        </aside>

        <main className="dashboard-main">
          <Outlet context={{ user }} />
        </main>
      </div>

      <Footer />

      {showLogoutModal && (
        <div className="modal-backdrop">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            <h3 id="logout-title">Confirm Logout</h3>
            <p>You will be signed out of HealthForecastAI and returned to the login page.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}