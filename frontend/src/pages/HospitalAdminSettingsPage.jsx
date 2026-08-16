import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
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
import {
  fetchHospitalProfile,
  updateHospitalProfile,
  fetchDepartments,
  fetchHospitalDoctors,
  createDepartment,
  updateDepartment,
  removeDepartment,
  updateMyProfile,
  changeMyPassword,
  getPreference,
  setPreference,
} from "../services/hospitalAdminApi.js";

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

const DEFAULT_ALERT_THRESHOLDS = { readmissionThreshold: 10, bedOccupancyThreshold: 85, criticalAlertEmail: true };
const DEFAULT_NOTIFICATIONS = { notifyReadmission: true, notifyOccupancy: true, notifyWeeklyReport: true, notifyNewUser: false };
const DEFAULT_REPORT_PREFS = { reportFormat: "PDF", autoGenerateWeekly: true, autoGenerateMonthly: true, reportRecipients: "" };
const DEFAULT_PRIVACY = { dataRetention: "24", auditLogAccess: true };
const DEFAULT_APPEARANCE = { defaultTheme: "light", compactLayout: false };

export function HospitalAdminSettingsPage() {
  const { user } = useOutletContext();
  const { updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.mobileNumber || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [hospitalLoading, setHospitalLoading] = useState(true);
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [hospitalPhone, setHospitalPhone] = useState("");
  const [hospitalType, setHospitalType] = useState("Multi-Specialty Hospital");
  const [ownershipType, setOwnershipType] = useState("Private Hospital");

  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptHeadId, setNewDeptHeadId] = useState("");

  const [readmissionThreshold, setReadmissionThreshold] = useState(DEFAULT_ALERT_THRESHOLDS.readmissionThreshold);
  const [bedOccupancyThreshold, setBedOccupancyThreshold] = useState(DEFAULT_ALERT_THRESHOLDS.bedOccupancyThreshold);
  const [criticalAlertEmail, setCriticalAlertEmail] = useState(DEFAULT_ALERT_THRESHOLDS.criticalAlertEmail);

  const [notifyReadmission, setNotifyReadmission] = useState(DEFAULT_NOTIFICATIONS.notifyReadmission);
  const [notifyOccupancy, setNotifyOccupancy] = useState(DEFAULT_NOTIFICATIONS.notifyOccupancy);
  const [notifyWeeklyReport, setNotifyWeeklyReport] = useState(DEFAULT_NOTIFICATIONS.notifyWeeklyReport);
  const [notifyNewUser, setNotifyNewUser] = useState(DEFAULT_NOTIFICATIONS.notifyNewUser);

  const [reportFormat, setReportFormat] = useState(DEFAULT_REPORT_PREFS.reportFormat);
  const [autoGenerateWeekly, setAutoGenerateWeekly] = useState(DEFAULT_REPORT_PREFS.autoGenerateWeekly);
  const [autoGenerateMonthly, setAutoGenerateMonthly] = useState(DEFAULT_REPORT_PREFS.autoGenerateMonthly);
  const [reportRecipients, setReportRecipients] = useState(user?.email || "");

  const [dataRetention, setDataRetention] = useState(DEFAULT_PRIVACY.dataRetention);
  const [auditLogAccess, setAuditLogAccess] = useState(DEFAULT_PRIVACY.auditLogAccess);

  const [defaultTheme, setDefaultTheme] = useState(DEFAULT_APPEARANCE.defaultTheme);
  const [compactLayout, setCompactLayout] = useState(DEFAULT_APPEARANCE.compactLayout);

  const flashSaved = (message = "Settings saved successfully.") => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(""), 2500);
  };

  const flashError = (message = "Something went wrong.") => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 3500);
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        setHospitalLoading(true);
        const data = await fetchHospitalProfile();
        setHospitalName(data.hospitalName);
        setHospitalAddress(data.hospitalAddress);
        setHospitalPhone(data.hospitalContact);
        setHospitalType(data.hospitalType);
        setOwnershipType(data.ownershipType);
      } catch (err) {
        flashError(err.message);
      } finally {
        setHospitalLoading(false);
      }
    }
    loadProfile();
  }, []);

  useEffect(() => {
    async function loadDepartmentsData() {
      try {
        setDepartmentsLoading(true);
        const [deptData, doctorData] = await Promise.all([
          fetchDepartments(),
          fetchHospitalDoctors(),
        ]);
        setDepartments(deptData);
        setDoctorOptions(doctorData);
      } catch (err) {
        flashError(err.message);
      } finally {
        setDepartmentsLoading(false);
      }
    }
    loadDepartmentsData();
  }, []);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const [
          alertPrefs,
          notifPrefs,
          reportPrefs,
          privacyPrefs,
          appearancePrefs,
          twoFactorPref,
        ] = await Promise.all([
          getPreference("hospitalAlertThresholds"),
          getPreference("hospitalNotificationPrefs"),
          getPreference("hospitalReportPrefs"),
          getPreference("hospitalPrivacyPrefs"),
          getPreference("hospitalAppearancePrefs"),
          getPreference("twoFactorEnabled"),
        ]);

        if (alertPrefs) {
          setReadmissionThreshold(alertPrefs.readmissionThreshold ?? DEFAULT_ALERT_THRESHOLDS.readmissionThreshold);
          setBedOccupancyThreshold(alertPrefs.bedOccupancyThreshold ?? DEFAULT_ALERT_THRESHOLDS.bedOccupancyThreshold);
          setCriticalAlertEmail(alertPrefs.criticalAlertEmail ?? DEFAULT_ALERT_THRESHOLDS.criticalAlertEmail);
        }

        if (notifPrefs) {
          setNotifyReadmission(notifPrefs.notifyReadmission ?? DEFAULT_NOTIFICATIONS.notifyReadmission);
          setNotifyOccupancy(notifPrefs.notifyOccupancy ?? DEFAULT_NOTIFICATIONS.notifyOccupancy);
          setNotifyWeeklyReport(notifPrefs.notifyWeeklyReport ?? DEFAULT_NOTIFICATIONS.notifyWeeklyReport);
          setNotifyNewUser(notifPrefs.notifyNewUser ?? DEFAULT_NOTIFICATIONS.notifyNewUser);
        }

        if (reportPrefs) {
          setReportFormat(reportPrefs.reportFormat ?? DEFAULT_REPORT_PREFS.reportFormat);
          setAutoGenerateWeekly(reportPrefs.autoGenerateWeekly ?? DEFAULT_REPORT_PREFS.autoGenerateWeekly);
          setAutoGenerateMonthly(reportPrefs.autoGenerateMonthly ?? DEFAULT_REPORT_PREFS.autoGenerateMonthly);
          setReportRecipients(reportPrefs.reportRecipients || user?.email || "");
        }

        if (privacyPrefs) {
          setDataRetention(privacyPrefs.dataRetention ?? DEFAULT_PRIVACY.dataRetention);
          setAuditLogAccess(privacyPrefs.auditLogAccess ?? DEFAULT_PRIVACY.auditLogAccess);
        }

        if (appearancePrefs) {
          setDefaultTheme(appearancePrefs.defaultTheme ?? DEFAULT_APPEARANCE.defaultTheme);
          setCompactLayout(appearancePrefs.compactLayout ?? DEFAULT_APPEARANCE.compactLayout);
        }

        if (twoFactorPref) {
          setTwoFactorEnabled(twoFactorPref.enabled ?? false);
        }
      } catch (err) {
        console.error("Failed to load preferences:", err);
      }
    }
    loadPreferences();
  }, []);

  const handleSaveProfile = async (event) => {
  event.preventDefault();
  try {
    const updated = await updateMyProfile({ fullName, email, mobileNumber: phone });
    updateUser({
      fullName: updated.fullName,
      email: updated.email,
      mobileNumber: updated.mobileNumber,
    });
    flashSaved("Profile updated successfully.");
  } catch (err) {
    flashError(err.message);
  }
};

  const handleChangePassword = async (event) => {
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

    try {
      await changeMyPassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      flashSaved("Password changed successfully.");
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  const handleToggleTwoFactor = async (checked) => {
    setTwoFactorEnabled(checked);
    try {
      await setPreference("twoFactorEnabled", { enabled: checked });
    } catch (err) {
      flashError(err.message);
    }
  };

  const handleSaveHospitalProfile = async (event) => {
    event.preventDefault();
    try {
      await updateHospitalProfile({
        hospitalName,
        hospitalType,
        ownershipType,
        hospitalContact: hospitalPhone,
        hospitalAddress,
      });
      flashSaved("Hospital profile updated.");
    } catch (err) {
      flashError(err.message);
    }
  };

  const handleAddDepartment = async (event) => {
    event.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      const created = await createDepartment({
        name: newDeptName.trim(),
        head_doctor_id: newDeptHeadId ? Number(newDeptHeadId) : null,
      });
      setDepartments((prev) => [...prev, created]);
      setNewDeptName("");
      setNewDeptHeadId("");
      flashSaved("Department added.");
    } catch (err) {
      flashError(err.message);
    }
  };

  const handleRemoveDepartment = async (id) => {
    try {
      await removeDepartment(id);
      setDepartments((prev) => prev.filter((dept) => dept.id !== id));
      flashSaved("Department removed.");
    } catch (err) {
      flashError(err.message);
    }
  };

  const toggleDepartmentActive = async (dept) => {
    try {
      const updated = await updateDepartment(dept.id, { is_active: !dept.isActive });
      setDepartments((prev) => prev.map((d) => (d.id === dept.id ? updated : d)));
    } catch (err) {
      flashError(err.message);
    }
  };

  const handleSaveAlertThresholds = async (event) => {
    event.preventDefault();
    try {
      await setPreference("hospitalAlertThresholds", {
        readmissionThreshold: Number(readmissionThreshold),
        bedOccupancyThreshold: Number(bedOccupancyThreshold),
        criticalAlertEmail,
      });
      flashSaved("Alert thresholds updated.");
    } catch (err) {
      flashError(err.message);
    }
  };

  const handleSaveNotifications = async (event) => {
    event.preventDefault();
    try {
      await setPreference("hospitalNotificationPrefs", {
        notifyReadmission,
        notifyOccupancy,
        notifyWeeklyReport,
        notifyNewUser,
      });
      flashSaved("Notification preferences updated.");
    } catch (err) {
      flashError(err.message);
    }
  };

  const handleSaveReportPrefs = async (event) => {
    event.preventDefault();
    try {
      await setPreference("hospitalReportPrefs", {
        reportFormat,
        autoGenerateWeekly,
        autoGenerateMonthly,
        reportRecipients,
      });
      flashSaved("Report preferences updated.");
    } catch (err) {
      flashError(err.message);
    }
  };

  const handleSavePrivacy = async (event) => {
    event.preventDefault();
    try {
      await setPreference("hospitalPrivacyPrefs", { dataRetention, auditLogAccess });
      flashSaved("Data & privacy settings updated.");
    } catch (err) {
      flashError(err.message);
    }
  };

  const handleExportMyData = () => {
    const exportPayload = {
      profile: { fullName, email, phone },
      hospital: { hospitalName, hospitalType, ownershipType, hospitalPhone, hospitalAddress },
      preferences: {
        alertThresholds: { readmissionThreshold, bedOccupancyThreshold, criticalAlertEmail },
        notifications: { notifyReadmission, notifyOccupancy, notifyWeeklyReport, notifyNewUser },
        reportPreferences: { reportFormat, autoGenerateWeekly, autoGenerateMonthly, reportRecipients },
        privacy: { dataRetention, auditLogAccess },
        appearance: { defaultTheme, compactLayout },
      },
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-account-data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveAppearance = async (event) => {
    event.preventDefault();
    try {
      await setPreference("hospitalAppearancePrefs", { defaultTheme, compactLayout });
      flashSaved("Appearance settings updated.");
    } catch (err) {
      flashError(err.message);
    }
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
          {errorMessage && <div className="settings-error-banner">{errorMessage}</div>}

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
                      <button
                        type="button"
                        className="password-toggle-icon"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
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
                      <button
                        type="button"
                        className="password-toggle-icon"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
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
                      <button
                        type="button"
                        className="password-toggle-icon"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </label>
                </div>

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
                    onChange={(e) => handleToggleTwoFactor(e.target.checked)}
                  />
                  <span>Require a verification code at login</span>
                </label>
              </article>
            </>
          )}

          {/* HOSPITAL PROFILE */}
          {activeTab === "hospital" && (
            <form className="dashboard-panel" onSubmit={handleSaveHospitalProfile}>
              <div className="panel-header-row">
                <div>
                  <h2><FaBuilding /> Hospital Profile</h2>
                  <p>Information shown across dashboards and reports</p>
                </div>
              </div>

              {hospitalLoading ? (
                <p>Loading hospital profile...</p>
              ) : (
                <>
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
                </>
              )}
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

              {departmentsLoading ? (
                <p>Loading departments...</p>
              ) : (
                <>
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
                        {departments.length === 0 ? (
                          <tr>
                            <td colSpan={4}>No departments added yet.</td>
                          </tr>
                        ) : (
                          departments.map((dept) => (
                            <tr key={dept.id}>
                              <td>{dept.name}</td>
                              <td>{dept.headDoctorName || "Unassigned"}</td>
                              <td>
                                <button
                                  type="button"
                                  className={`risk-pill ${dept.isActive ? "low" : "high"}`}
                                  style={{ border: "none", cursor: "pointer" }}
                                  onClick={() => toggleDepartmentActive(dept)}
                                >
                                  {dept.isActive ? "Active" : "Inactive"}
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
                          ))
                        )}
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
                      <select value={newDeptHeadId} onChange={(e) => setNewDeptHeadId(e.target.value)}>
                        <option value="">Unassigned</option>
                        {doctorOptions.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.fullName}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="dashboard-inline-actions" style={{ alignItems: "flex-end" }}>
                      <button type="submit" className="primary-button">
                        <FaPlus /> Add Department
                      </button>
                    </div>
                  </form>
                </>
              )}
            </article>
          )}

          {/* ALERT THRESHOLDS */}
          {activeTab === "alerts" && (
            <form className="dashboard-panel" onSubmit={handleSaveAlertThresholds}>
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
            <form className="dashboard-panel" onSubmit={handleSaveNotifications}>
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
            <form className="dashboard-panel" onSubmit={handleSaveReportPrefs}>
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
            <form className="dashboard-panel" onSubmit={handleSavePrivacy}>
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
                <button type="button" className="secondary-button" onClick={handleExportMyData}>
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
            <form className="dashboard-panel" onSubmit={handleSaveAppearance}>
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