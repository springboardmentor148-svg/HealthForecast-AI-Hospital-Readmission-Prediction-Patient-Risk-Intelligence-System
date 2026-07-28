import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaServer,
  FaUsersGear,
  FaBell,
  FaClipboardList,
  FaShieldHalved,
  FaPalette,
  FaFloppyDisk,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa6";

const tabs = [
  { id: "profile", label: "Profile", icon: FaUser },
  { id: "security", label: "Security & Password", icon: FaLock },
  { id: "platform", label: "Platform Configuration", icon: FaServer },
  { id: "roles", label: "Roles & Permissions", icon: FaUsersGear },
  { id: "alerts", label: "System Alerts", icon: FaShieldHalved },
  { id: "notifications", label: "Notifications", icon: FaBell },
  { id: "audit", label: "Audit & Reports", icon: FaClipboardList },
  { id: "privacy", label: "Data & Privacy", icon: FaShieldHalved },
  { id: "appearance", label: "Appearance", icon: FaPalette },
];

const permissionRoles = ["Doctor", "Hospital Administrator", "Healthcare Researcher"];
const permissionColumns = ["View Predictions", "Manage Users", "Export Data", "View Audit Logs"];

export function AdminSettingsPage() {
  const { user } = useOutletContext();
  const [activeTab, setActiveTab] = useState("profile");
  const [savedMessage, setSavedMessage] = useState("");

  // Profile
  const [fullName, setFullName] = useState(user?.fullName || "Alex Carter");
  const [email, setEmail] = useState(user?.email || "alex.carter@healthforecastai.com");
  const [phone, setPhone] = useState("+91 98765 43210");

  // Security / Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [passwordError, setPasswordError] = useState("");

  // Platform Configuration
  const [platformName, setPlatformName] = useState("HealthForecastAI");
  const [supportEmail, setSupportEmail] = useState("support@healthforecastai.com");
  const [environment, setEnvironment] = useState("Production");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [apiRateLimit, setApiRateLimit] = useState(1000);

  // Roles & Permissions
  const [permissions, setPermissions] = useState({
    Doctor: { "View Predictions": true, "Manage Users": false, "Export Data": false, "View Audit Logs": false },
    "Hospital Administrator": { "View Predictions": true, "Manage Users": true, "Export Data": true, "View Audit Logs": false },
    "Healthcare Researcher": { "View Predictions": true, "Manage Users": false, "Export Data": true, "View Audit Logs": false },
  });

  const togglePermission = (role, column) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [column]: !prev[role][column] },
    }));
  };

  // System Alerts
  const [uptimeThreshold, setUptimeThreshold] = useState(99);
  const [failedLoginThreshold, setFailedLoginThreshold] = useState(5);
  const [errorRateThreshold, setErrorRateThreshold] = useState(2);
  const [criticalAlertEmail, setCriticalAlertEmail] = useState(true);

  // Notifications
  const [notifyNewUser, setNotifyNewUser] = useState(true);
  const [notifySecurityEvent, setNotifySecurityEvent] = useState(true);
  const [notifySystemHealth, setNotifySystemHealth] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(false);

  // Audit & Reports
  const [auditExportFormat, setAuditExportFormat] = useState("CSV");
  const [auditRetention, setAuditRetention] = useState("24");
  const [autoExportMonthly, setAutoExportMonthly] = useState(true);

  // Data & Privacy
  const [dataRetention, setDataRetention] = useState("36");
  const [allowDataExportRequests, setAllowDataExportRequests] = useState(true);

  // Appearance
  const [defaultTheme, setDefaultTheme] = useState("light");
  const [compactLayout, setCompactLayout] = useState(false);

  const flashSaved = (message = "Settings saved successfully.") => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(""), 2500);
  };

  const handleSaveProfile = (event) => {
    event.preventDefault();
    flashSaved("Profile updated successfully.");
  };

  const handleChangePassword = (event) => {
    event.preventDefault();
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    flashSaved("Password changed successfully.");
  };

  return (
    <>
      <section className="dashboard-page-header">
        <h1>Settings</h1>
        <p>Manage your account, platform configuration, and system-wide preferences.</p>
      </section>

      <div className="settings-shell">
        <nav className="settings-tabs" aria-label="Settings sections">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`settings-tab-button ${activeTab === tab.id ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="settings-content">
          {savedMessage && <div className="settings-saved-banner">{savedMessage}</div>}

          {/* PROFILE */}
          {activeTab === "profile" && (
            <form className="dashboard-panel" onSubmit={handleSaveProfile}>
              <div className="panel-header-row">
                <div>
                  <h2><FaUser /> Profile</h2>
                  <p>Your personal account information</p>
                </div>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>Full Name</span>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </label>

                <label className="form-field">
                  <span>Email Address</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>

                <label className="form-field">
                  <span>Phone Number</span>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>

                <label className="form-field">
                  <span>Role</span>
                  <input type="text" value="System Administrator" disabled />
                </label>
              </div>

              <div className="dashboard-inline-actions">
                <button type="submit" className="primary-button">
                  <FaFloppyDisk /> Save Profile
                </button>
              </div>
            </form>
          )}

          {/* SECURITY / PASSWORD */}
          {activeTab === "security" && (
            <>
              <form className="dashboard-panel" onSubmit={handleChangePassword}>
                <div className="panel-header-row">
                  <div>
                    <h2><FaLock /> Change Password</h2>
                    <p>Use a strong password you don't use elsewhere</p>
                  </div>
                </div>

                {passwordError && <div className="settings-error-banner">{passwordError}</div>}

                <div className="form-grid">
                  <label className="form-field">
                    <span>Current Password</span>
                    <div className="password-input-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                  </label>

                  <label className="form-field">
                    <span>New Password</span>
                    <div className="password-input-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </label>

                  <label className="form-field">
                    <span>Confirm New Password</span>
                    <div className="password-input-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </label>
                </div>

                <button
                  type="button"
                  className="secondary-button settings-show-password-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                  {showPassword ? "Hide Passwords" : "Show Passwords"}
                </button>

                <div className="dashboard-inline-actions">
                  <button type="submit" className="primary-button">
                    <FaFloppyDisk /> Update Password
                  </button>
                </div>
              </form>

              <article className="dashboard-panel">
                <div className="panel-header-row">
                  <div>
                    <h2><FaShieldHalved /> Two-Factor Authentication</h2>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                </div>

                <label className="settings-toggle-row">
                  <input
                    type="checkbox"
                    checked={twoFactorEnabled}
                    onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                  />
                  <span>Require a verification code at login</span>
                </label>
              </article>
            </>
          )}

          {/* PLATFORM CONFIGURATION */}
          {activeTab === "platform" && (
            <form
              className="dashboard-panel"
              onSubmit={(e) => {
                e.preventDefault();
                flashSaved("Platform configuration updated.");
              }}
            >
              <div className="panel-header-row">
                <div>
                  <h2><FaServer /> Platform Configuration</h2>
                  <p>System-wide settings that apply across HealthForecastAI</p>
                </div>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>Platform Name</span>
                  <input type="text" value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
                </label>

                <label className="form-field">
                  <span>Support Email</span>
                  <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                </label>

                <label className="form-field">
                  <span>Environment</span>
                  <select value={environment} onChange={(e) => setEnvironment(e.target.value)}>
                    <option>Production</option>
                    <option>Staging</option>
                    <option>Development</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>API Rate Limit (requests / min)</span>
                  <input
                    type="number"
                    min="0"
                    value={apiRateLimit}
                    onChange={(e) => setApiRateLimit(e.target.value)}
                  />
                </label>
              </div>

              <label className="settings-toggle-row">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                />
                <span>Enable maintenance mode (blocks non-admin access)</span>
              </label>

              <div className="dashboard-inline-actions">
                <button type="submit" className="primary-button">
                  <FaFloppyDisk /> Save Configuration
                </button>
              </div>
            </form>
          )}

          {/* ROLES & PERMISSIONS */}
          {activeTab === "roles" && (
            <article className="dashboard-panel">
              <div className="panel-header-row">
                <div>
                  <h2><FaUsersGear /> Roles &amp; Permissions</h2>
                  <p>Control what each role is allowed to do across the platform</p>
                </div>
              </div>

              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      {permissionColumns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissionRoles.map((role) => (
                      <tr key={role}>
                        <td>{role}</td>
                        {permissionColumns.map((col) => (
                          <td key={col}>
                            <button
                              type="button"
                              className={`risk-pill ${permissions[role][col] ? "low" : "high"}`}
                              style={{ border: "none", cursor: "pointer" }}
                              onClick={() => togglePermission(role, col)}
                            >
                              {permissions[role][col] ? "Allowed" : "Blocked"}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="dashboard-inline-actions" style={{ marginTop: "20px" }}>
                <button type="button" className="primary-button" onClick={() => flashSaved("Role permissions updated.")}>
                  <FaFloppyDisk /> Save Permissions
                </button>
              </div>
            </article>
          )}

          {/* SYSTEM ALERTS */}
          {activeTab === "alerts" && (
            <form
              className="dashboard-panel"
              onSubmit={(e) => {
                e.preventDefault();
                flashSaved("System alert thresholds updated.");
              }}
            >
              <div className="panel-header-row">
                <div>
                  <h2><FaShieldHalved /> System Alerts</h2>
                  <p>Trigger alerts when platform metrics cross these limits</p>
                </div>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>Minimum Uptime Alert (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={uptimeThreshold}
                    onChange={(e) => setUptimeThreshold(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span>Failed Login Attempts Alert</span>
                  <input
                    type="number"
                    min="0"
                    value={failedLoginThreshold}
                    onChange={(e) => setFailedLoginThreshold(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span>API Error Rate Alert (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={errorRateThreshold}
                    onChange={(e) => setErrorRateThreshold(e.target.value)}
                  />
                </label>
              </div>

              <label className="settings-toggle-row">
                <input
                  type="checkbox"
                  checked={criticalAlertEmail}
                  onChange={(e) => setCriticalAlertEmail(e.target.checked)}
                />
                <span>Email me immediately for critical threshold breaches</span>
              </label>

              <div className="dashboard-inline-actions">
                <button type="submit" className="primary-button">
                  <FaFloppyDisk /> Save Thresholds
                </button>
              </div>
            </form>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <form
              className="dashboard-panel"
              onSubmit={(e) => {
                e.preventDefault();
                flashSaved("Notification preferences updated.");
              }}
            >
              <div className="panel-header-row">
                <div>
                  <h2><FaBell /> Notification Preferences</h2>
                  <p>Choose which alerts appear in your notifications panel</p>
                </div>
              </div>

              <div className="settings-toggle-list">
                <label className="settings-toggle-row">
                  <input type="checkbox" checked={notifyNewUser} onChange={(e) => setNotifyNewUser(e.target.checked)} />
                  <span>New user account created</span>
                </label>
                <label className="settings-toggle-row">
                  <input type="checkbox" checked={notifySecurityEvent} onChange={(e) => setNotifySecurityEvent(e.target.checked)} />
                  <span>Security events (failed logins, suspicious activity)</span>
                </label>
                <label className="settings-toggle-row">
                  <input type="checkbox" checked={notifySystemHealth} onChange={(e) => setNotifySystemHealth(e.target.checked)} />
                  <span>System health and uptime alerts</span>
                </label>
                <label className="settings-toggle-row">
                  <input type="checkbox" checked={notifyWeeklyDigest} onChange={(e) => setNotifyWeeklyDigest(e.target.checked)} />
                  <span>Weekly platform activity digest</span>
                </label>
              </div>

              <div className="dashboard-inline-actions">
                <button type="submit" className="primary-button">
                  <FaFloppyDisk /> Save Preferences
                </button>
              </div>
            </form>
          )}

          {/* AUDIT & REPORTS */}
          {activeTab === "audit" && (
            <form
              className="dashboard-panel"
              onSubmit={(e) => {
                e.preventDefault();
                flashSaved("Audit and report preferences updated.");
              }}
            >
              <div className="panel-header-row">
                <div>
                  <h2><FaClipboardList /> Audit &amp; Reports</h2>
                  <p>Control how audit logs are stored and exported</p>
                </div>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>Audit Export Format</span>
                  <select value={auditExportFormat} onChange={(e) => setAuditExportFormat(e.target.value)}>
                    <option>CSV</option>
                    <option>PDF</option>
                    <option>JSON</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Audit Log Retention (months)</span>
                  <select value={auditRetention} onChange={(e) => setAuditRetention(e.target.value)}>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                  </select>
                </label>
              </div>

              <label className="settings-toggle-row">
                <input
                  type="checkbox"
                  checked={autoExportMonthly}
                  onChange={(e) => setAutoExportMonthly(e.target.checked)}
                />
                <span>Auto-export audit logs at the end of each month</span>
              </label>

              <div className="dashboard-inline-actions">
                <button type="button" className="secondary-button">
                  Export Audit Logs Now
                </button>
                <button type="submit" className="primary-button">
                  <FaFloppyDisk /> Save Preferences
                </button>
              </div>
            </form>
          )}

          {/* DATA & PRIVACY */}
          {activeTab === "privacy" && (
            <form
              className="dashboard-panel"
              onSubmit={(e) => {
                e.preventDefault();
                flashSaved("Data & privacy settings updated.");
              }}
            >
              <div className="panel-header-row">
                <div>
                  <h2><FaShieldHalved /> Data &amp; Privacy</h2>
                  <p>Manage platform-wide data retention and export policy</p>
                </div>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>Data Retention Period (months)</span>
                  <select value={dataRetention} onChange={(e) => setDataRetention(e.target.value)}>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                    <option value="36">36 months</option>
                    <option value="60">60 months</option>
                  </select>
                </label>
              </div>

              <label className="settings-toggle-row">
                <input
                  type="checkbox"
                  checked={allowDataExportRequests}
                  onChange={(e) => setAllowDataExportRequests(e.target.checked)}
                />
                <span>Allow users to request a full export of their data</span>
              </label>

              <div className="dashboard-inline-actions">
                <button type="submit" className="primary-button">
                  <FaFloppyDisk /> Save Privacy Settings
                </button>
              </div>
            </form>
          )}

          {/* APPEARANCE */}
          {activeTab === "appearance" && (
            <form
              className="dashboard-panel"
              onSubmit={(e) => {
                e.preventDefault();
                flashSaved("Appearance settings updated.");
              }}
            >
              <div className="panel-header-row">
                <div>
                  <h2><FaPalette /> Appearance</h2>
                  <p>Personalize how the dashboard looks for you</p>
                </div>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>Default Theme</span>
                  <select value={defaultTheme} onChange={(e) => setDefaultTheme(e.target.value)}>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
              </div>

              <label className="settings-toggle-row">
                <input
                  type="checkbox"
                  checked={compactLayout}
                  onChange={(e) => setCompactLayout(e.target.checked)}
                />
                <span>Use compact dashboard layout</span>
              </label>

              <div className="dashboard-inline-actions">
                <button type="submit" className="primary-button">
                  <FaFloppyDisk /> Save Appearance
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}