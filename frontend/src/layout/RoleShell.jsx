import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import {
  FaArrowRightFromBracket,
  FaBars,
  FaXmark,
  FaMoon,
  FaSun,
  FaBell,
  FaPenToSquare,
} from "react-icons/fa6";

import "./AppLayout.css";

import { useAuth } from "../auth/AuthContext.jsx";
import { useTheme } from "../theme/ThemeContext.jsx";

const defaultNotifications = [
  { id: 1, text: "New doctor account created: Dr. Priya Nair.", time: "10 min ago" },
  { id: 2, text: "Failed login attempt for dr.cole@hospital.org.", time: "1 hr ago" },
  { id: 3, text: "Weekly prediction report is ready to view.", time: "Yesterday" },
];

export function RoleShell({ sidebarItems, profilePath, notifications }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const notifItems = notifications && notifications.length ? notifications : defaultNotifications;

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate("/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  const goToEditProfile = () => {
    setShowProfileMenu(false);
    navigate(profilePath || "/app/profile");
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-brand">
          <span className="dashboard-topbar-mark">HF</span>
          <span className="dashboard-topbar-name">HealthForecastAI</span>
        </div>

        <div className="dashboard-topbar-actions">
          <div className="topbar-dropdown-wrap" ref={notifRef}>
            <button
              type="button"
              className="topbar-icon-button"
              aria-label="Notifications"
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              <FaBell />
              {notifItems.length > 0 && <span className="topbar-notif-dot" />}
            </button>

            {showNotifications && (
              <div className="topbar-dropdown topbar-dropdown-wide">
                <div className="topbar-dropdown-header">Notifications</div>
                <ul className="topbar-notif-list">
                  {notifItems.length === 0 && (
                    <li className="topbar-notif-item">
                      <p>No new notifications.</p>
                    </li>
                  )}
                  {notifItems.map((n) => (
                    <li key={n.id} className="topbar-notif-item">
                      <p>{n.text}</p>
                      <span>{n.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            type="button"
            className="topbar-icon-button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <FaSun /> : <FaMoon />}
          </button>

          <div className="topbar-dropdown-wrap" ref={profileRef}>
            <button
              type="button"
              className="dashboard-topbar-user"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              aria-label="Open profile menu"
            >
              <span className="topbar-user-avatar">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </span>
              <span className="topbar-user-name">{user?.fullName || "User"}</span>
            </button>

            {showProfileMenu && (
              <div className="topbar-dropdown topbar-profile-menu">
                <div className="topbar-profile-info">
                  <span className="topbar-user-avatar topbar-user-avatar-lg">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                  </span>
                  <div>
                    <strong>{user?.fullName || "User"}</strong>
                    <span>{user?.role || "Hospital Administrator"}</span>
                  </div>
                </div>

                <button type="button" className="topbar-profile-edit-btn" onClick={goToEditProfile}>
                  <FaPenToSquare /> Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <button className="mobile-menu-button" onClick={() => setSidebarOpen(true)}>
        <FaBars />
      </button>

      <div className="dashboard-layout">
        <aside className={`dashboard-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
          <button className="sidebar-close" onClick={closeSidebar}>
            <FaXmark />
          </button>

          <nav className="sidebar-nav" aria-label="Navigation">
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

      {showLogoutModal && (
        <div className="modal-backdrop">
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="logout-title">
            <h3 id="logout-title">Confirm Logout</h3>
            <p>You will be signed out of HealthForecastAI and returned to the login page.</p>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setShowLogoutModal(false)}>
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