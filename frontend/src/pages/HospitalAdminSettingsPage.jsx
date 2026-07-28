import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaBuilding,
  FaSliders,
  FaBell,
  FaFileWaveform,
  FaShieldHalved,
  FaPalette,
  FaFloppyDisk,
  FaPlus,
  FaTrash,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa6";

const tabs = [
  { id: "profile", label: "Profile", icon: FaUser },
  { id: "security", label: "Security & Password", icon: FaLock },
  { id: "hospital", label: "Hospital Profile", icon: FaBuilding },
  { id: "departments", label: "Departments", icon: FaSliders },
  { id: "alerts", label: "Alert Thresholds", icon: FaShieldHalved },
  { id: "notifications", label: "Notifications", icon: FaBell },
  { id: "reports", label: "Report Preferences", icon: FaFileWaveform },
  { id: "privacy", label: "Data & Privacy", icon: FaShieldHalved },
  { id: "appearance", label: "Appearance", icon: FaPalette },
];

export function HospitalAdminSettingsPage() {
  const { user } = useOutletContext();
  const [activeTab, setActiveTab] = useState("profile");
  const [savedMessage, setSavedMessage] = useState("");

  // Profile
  const [fullName, setFullName] = useState(user?.fullName || "Michael Torres");
  const [email, setEmail] = useState(user?.email || "michael.torres@healthforecastai.com");
  const [phone, setPhone] = useState("+91 98765 43210");

  // Security / Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Hospital Profile
  const [hospitalName, setHospitalName] = useState("City Care General Hospital");
  const [hospitalAddress, setHospitalAddress] = useState("221 MG Road, Mumbai, Maharashtra");
  const [hospitalPhone, setHospitalPhone] = useState("+91 22 4567 8900");
  const [hospitalType, setHospitalType] = useState("Multi-Specialty Hospital");
 const [ownershipType, setOwnershipType] = useState("Private Hospital");

  // Departments
  const [departments, setDepartments] = useState([
    { id: 1, name: "Cardiology", head: "Dr. Priya Nair", active: true },
    { id: 2, name: "Endocrinology", head: "Dr. Farhan Sheikh", active: true },
    { id: 3, name: "General Surgery", head: "Dr. Arjun Verma", active: true },
  ]);
  const [newDeptName, setNewDeptName] = useState("");
  const departmentOptions = [
  "Cardiology",
  "Endocrinology",
  "General Surgery",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Oncology",
  "Radiology",
  "Emergency Medicine",
  "Internal Medicine",
  "Gynecology & Obstetrics",
  "Psychiatry",
  "Dermatology",
  "ENT (Ear, Nose, Throat)",
  "Urology",
  "Nephrology",
  "Pulmonology",
  "Gastroenterology",
  "Anesthesiology",
  "Pathology",
];

  const [newDeptHead, setNewDeptHead] = useState("");

  // Alert Thresholds
  const [readmissionThreshold, setReadmissionThreshold] = useState(10);
  const [bedOccupancyThreshold, setBedOccupancyThreshold] = useState(85);
  const [criticalAlertEmail, setCriticalAlertEmail] = useState(true);

  // Notifications
  const [notifyReadmission, setNotifyReadmission] = useState(true);
  const [notifyOccupancy, setNotifyOccupancy] = useState(true);
  const [notifyWeeklyReport, setNotifyWeeklyReport] = useState(true);
  const [notifyNewUser, setNotifyNewUser] = useState(false);

  // Report Preferences
  const [reportFormat, setReportFormat] = useState("PDF");
  const [autoGenerateWeekly, setAutoGenerateWeekly] = useState(true);
  const [autoGenerateMonthly, setAutoGenerateMonthly] = useState(true);
  const [reportRecipients, setReportRecipients] = useState("michael.torres@healthforecastai.com");

  // Data & Privacy
  const [dataRetention, setDataRetention] = useState("24");
  const [auditLogAccess, setAuditLogAccess] = useState(true);

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

  const handleAddDepartment = (event) => {
    event.preventDefault();
    if (!newDeptName.trim()) return;

    setDepartments((prev) => [
      ...prev,
      { id: Date.now(), name: newDeptName.trim(), head: newDeptHead.trim() || "Unassigned", active: true },
    ]);
    setNewDeptName("");
    setNewDeptHead("");
  };

  const handleRemoveDepartment = (id) => {
    setDepartments((prev) => prev.filter((dept) => dept.id !== id));
  };

  const toggleDepartmentActive = (id) => {
    setDepartments((prev) =>
      prev.map((dept) => (dept.id === id ? { ...dept, active: !dept.active } : dept))
    );
  };

  return (
    <>
      <section className="dashboard-page-header">
        <h1>Settings</h1>
        <p>Manage your account, hospital configuration, and platform preferences.</p>
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
                  <input type="text" value="Hospital Administrator" disabled />
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

          {/* HOSPITAL PROFILE */}
          {activeTab === "hospital" && (
            <form
              className="dashboard-panel"
              onSubmit={(e) => {
                e.preventDefault();
                flashSaved("Hospital profile updated.");
              }}
            >
              <div className="panel-header-row">
                <div>
                  <h2><FaBuilding /> Hospital Profile</h2>
                  <p>Information shown across dashboards and reports</p>
                </div>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>Hospital Name</span>
                  <input type="text" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} />
                </label>

                <label className="form-field">
  <span>Hospital Type</span>
  <select value={hospitalType} onChange={(e) => setHospitalType(e.target.value)}>
    <option>General Hospital</option>
    <option>Multi-Specialty Hospital</option>
    <option>Super-Specialty Hospital</option>
    <option>Teaching / University Hospital</option>
    <option>Specialty Clinic / Hospital</option>
    <option>Community Hospital</option>
    <option>District / Regional Hospital</option>
    <option>Rehabilitation Hospital</option>
    <option>Psychiatric Hospital</option>
    <option>Critical Access Hospital</option>
  </select>
</label>

<label className="form-field">
  <span>Ownership Type</span>
  <select value={ownershipType} onChange={(e) => setOwnershipType(e.target.value)}>
    <option>Government / Public Hospital</option>
    <option>Private Hospital</option>
    <option>Trust / Charitable Hospital</option>
    <option>Corporate Chain Hospital</option>
  </select>
</label>

                <label className="form-field">
                  <span>Contact Number</span>
                  <input type="tel" value={hospitalPhone} onChange={(e) => setHospitalPhone(e.target.value)} />
                </label>

                <label className="form-field" style={{ gridColumn: "1 / -1" }}>
                  <span>Address</span>
                  <input type="text" value={hospitalAddress} onChange={(e) => setHospitalAddress(e.target.value)} />
                </label>
              </div>

              <div className="dashboard-inline-actions">
                <button type="submit" className="primary-button">
                  <FaFloppyDisk /> Save Hospital Info
                </button>
              </div>
            </form>
          )}

          {/* DEPARTMENTS */}
          {activeTab === "departments" && (
            <article className="dashboard-panel">
              <div className="panel-header-row">
                <div>
                  <h2><FaSliders /> Department Management</h2>
                  <p>Add, assign heads, and manage active departments</p>
                </div>
              </div>

              <div className="dashboard-table-wrap">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Head</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr key={dept.id}>
                        <td>{dept.name}</td>
                        <td>{dept.head}</td>
                        <td>
                          <button
                            type="button"
                            className={`risk-pill ${dept.active ? "low" : "high"}`}
                            style={{ border: "none", cursor: "pointer" }}
                            onClick={() => toggleDepartmentActive(dept.id)}
                          >
                            {dept.active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => handleRemoveDepartment(dept.id)}
                          >
                            <FaTrash /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form className="form-grid settings-add-department" onSubmit={handleAddDepartment}>
                <label className="form-field">
                  <span>New Department Name</span>
                   <select value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)}>
          <option value="">Select Department</option>
          {departmentOptions
            .filter((name) => !departments.some((d) => d.name === name))
            .map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
        </select>
      </label>

                <label className="form-field">
                  <span>Department Head</span>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Neha Kapoor"
                    value={newDeptHead}
                    onChange={(e) => setNewDeptHead(e.target.value)}
                  />
                </label>

                <div className="dashboard-inline-actions" style={{ alignItems: "flex-end" }}>
                  <button type="submit" className="primary-button">
                    <FaPlus /> Add Department
                  </button>
                </div>
              </form>
            </article>
          )}

          {/* ALERT THRESHOLDS */}
          {activeTab === "alerts" && (
            <form
              className="dashboard-panel"
              onSubmit={(e) => {
                e.preventDefault();
                flashSaved("Alert thresholds updated.");
              }}
            >
              <div className="panel-header-row">
                <div>
                  <h2><FaShieldHalved /> Alert Thresholds</h2>
                  <p>Trigger alerts when hospital metrics cross these limits</p>
                </div>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>Readmission Rate Alert (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={readmissionThreshold}
                    onChange={(e) => setReadmissionThreshold(e.target.value)}
                  />
                </label>

                <label className="form-field">
                  <span>Bed Occupancy Alert (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={bedOccupancyThreshold}
                    onChange={(e) => setBedOccupancyThreshold(e.target.value)}
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
                  <input type="checkbox" checked={notifyReadmission} onChange={(e) => setNotifyReadmission(e.target.checked)} />
                  <span>Readmission rate threshold breaches</span>
                </label>
                <label className="settings-toggle-row">
                  <input type="checkbox" checked={notifyOccupancy} onChange={(e) => setNotifyOccupancy(e.target.checked)} />
                  <span>Bed occupancy threshold breaches</span>
                </label>
                <label className="settings-toggle-row">
                  <input type="checkbox" checked={notifyWeeklyReport} onChange={(e) => setNotifyWeeklyReport(e.target.checked)} />
                  <span>Weekly performance report ready</span>
                </label>
                <label className="settings-toggle-row">
                  <input type="checkbox" checked={notifyNewUser} onChange={(e) => setNotifyNewUser(e.target.checked)} />
                  <span>New doctor / staff account created</span>
                </label>
              </div>

              <div className="dashboard-inline-actions">
                <button type="submit" className="primary-button">
                  <FaFloppyDisk /> Save Preferences
                </button>
              </div>
            </form>
          )}

          {/* REPORT PREFERENCES */}
          {activeTab === "reports" && (
            <form
              className="dashboard-panel"
              onSubmit={(e) => {
                e.preventDefault();
                flashSaved("Report preferences updated.");
              }}
            >
              <div className="panel-header-row">
                <div>
                  <h2><FaFileWaveform /> Report Preferences</h2>
                  <p>Control how and when reports are generated and shared</p>
                </div>
              </div>

              <div className="form-grid">
                <label className="form-field">
                  <span>Default Report Format</span>
                  <select value={reportFormat} onChange={(e) => setReportFormat(e.target.value)}>
                    <option>PDF</option>
                    <option>Excel</option>
                    <option>CSV</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Report Recipients (comma separated)</span>
                  <input
                    type="text"
                    value={reportRecipients}
                    onChange={(e) => setReportRecipients(e.target.value)}
                  />
                </label>
              </div>

              <div className="settings-toggle-list">
                <label className="settings-toggle-row">
                  <input
                    type="checkbox"
                    checked={autoGenerateWeekly}
                    onChange={(e) => setAutoGenerateWeekly(e.target.checked)}
                  />
                  <span>Auto-generate weekly performance report</span>
                </label>
                <label className="settings-toggle-row">
                  <input
                    type="checkbox"
                    checked={autoGenerateMonthly}
                    onChange={(e) => setAutoGenerateMonthly(e.target.checked)}
                  />
                  <span>Auto-generate monthly outcome summary</span>
                </label>
              </div>

              <div className="dashboard-inline-actions">
                <button type="submit" className="primary-button">
                  <FaFloppyDisk /> Save Report Preferences
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
                  <h2><FaShieldHalved /> Data & Privacy</h2>
                  <p>Manage data retention and audit visibility</p>
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
                  checked={auditLogAccess}
                  onChange={(e) => setAuditLogAccess(e.target.checked)}
                />
                <span>Allow access to audit logs from this account</span>
              </label>

              <div className="dashboard-inline-actions">
                <button type="button" className="secondary-button">
                  Export My Data
                </button>
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