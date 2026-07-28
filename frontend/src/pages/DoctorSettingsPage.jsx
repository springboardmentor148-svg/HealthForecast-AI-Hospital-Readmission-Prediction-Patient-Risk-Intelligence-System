import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaBell,
  FaShieldHalved,
  FaPalette,
  FaFloppyDisk,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa6";

const tabs = [
  { id: "profile", label: "Profile", icon: FaUser },
  { id: "security", label: "Security & Password", icon: FaLock },
  { id: "notifications", label: "Notifications", icon: FaBell },
  { id: "access", label: "Data Access", icon: FaShieldHalved },
  { id: "appearance", label: "Appearance", icon: FaPalette },
];

export function DoctorSettingsPage() {
  const { user } = useOutletContext();
  const [activeTab, setActiveTab] = useState("profile");
  const [savedMessage, setSavedMessage] = useState("");

  // Profile
  const [fullName, setFullName] = useState(user?.fullName || "Dr. Ananya Sharma");
  const [email, setEmail] = useState(user?.email || "ananya.sharma@healthforecastai.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [specialty, setSpecialty] = useState("Cardiology");

  // Security / Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Notifications
  const [notifyHighRisk, setNotifyHighRisk] = useState(true);
  const [notifyPredictionReady, setNotifyPredictionReady] = useState(true);
  const [notifyFollowUp, setNotifyFollowUp] = useState(true);
  const [notifyWeeklySummary, setNotifyWeeklySummary] = useState(false);

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
        <p>Manage your account, notifications, and personal preferences.</p>
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
                  <span>Specialty</span>
                  <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                </label>

                <label className="form-field">
                  <span>Role</span>
                  <input type="text" value="Doctor" disabled />
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
                  <input
                    type="checkbox"
                    checked={notifyHighRisk}
                    onChange={(e) => setNotifyHighRisk(e.target.checked)}
                  />
                  <span>New high-risk patient flagged</span>
                </label>
                <label className="settings-toggle-row">
                  <input
                    type="checkbox"
                    checked={notifyPredictionReady}
                    onChange={(e) => setNotifyPredictionReady(e.target.checked)}
                  />
                  <span>Prediction result ready</span>
                </label>
                <label className="settings-toggle-row">
                  <input
                    type="checkbox"
                    checked={notifyFollowUp}
                    onChange={(e) => setNotifyFollowUp(e.target.checked)}
                  />
                  <span>Follow-up planning reminders</span>
                </label>
                <label className="settings-toggle-row">
                  <input
                    type="checkbox"
                    checked={notifyWeeklySummary}
                    onChange={(e) => setNotifyWeeklySummary(e.target.checked)}
                  />
                  <span>Weekly patient outcome summary</span>
                </label>
              </div>

              <div className="dashboard-inline-actions">
                <button type="submit" className="primary-button">
                  <FaFloppyDisk /> Save Preferences
                </button>
              </div>
            </form>
          )}

          {/* DATA ACCESS - read only, doctor apni permissions dekh sakta hai, change nahi kar sakta */}
          {activeTab === "access" && (
            <article className="dashboard-panel">
              <div className="panel-header-row">
                <div>
                  <h2><FaShieldHalved /> Data Access</h2>
                  <p>Your current access level on the HealthForecastAI platform</p>
                </div>
              </div>

              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Access Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Patient Records</td>
                      <td>Assigned Patients Only</td>
                    </tr>
                    <tr>
                      <td>Medical History</td>
                      <td>Assigned Patients Only</td>
                    </tr>
                    <tr>
                      <td>Risk Prediction Reports</td>
                      <td>Full Access</td>
                    </tr>
                    <tr>
                      <td>Readmission Forecasts</td>
                      <td>Full Access</td>
                    </tr>
                    <tr>
                      <td>Treatment Effectiveness Reports</td>
                      <td>Full Access</td>
                    </tr>
                    <tr>
                      <td>Care Recommendations</td>
                      <td>Full Access</td>
                    </tr>
                    <tr>
                      <td>Hospital Analytics Dashboard</td>
                      <td>Limited</td>
                    </tr>
                    <tr>
                      <td>User Management</td>
                      <td>No Access</td>
                    </tr>
                    <tr>
                      <td>AI Model Management</td>
                      <td>No Access</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p style={{ marginTop: "16px", fontSize: "14px", opacity: 0.75 }}>
                Access levels are configured by your System Administrator and
                cannot be changed from this page.
              </p>
            </article>
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