import { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  FaUser,
  FaLock,
  FaBell,
  FaShieldHalved,
  FaPalette,
  FaFloppyDisk,
  FaEye,
  FaEyeSlash,
  FaHospital,
} from "react-icons/fa6";
import {
  updateMyProfile,
  changeMyPassword,
  updateMyTwoFactor,
  updateMyNotificationPreferences,
  updateMyAppearancePreferences,
  fetchAllMyPreferences,
} from "../services/userApi.js";

const tabs = [
  { id: "profile", label: "Profile", icon: FaUser },
  { id: "security", label: "Security & Password", icon: FaLock },
  { id: "notifications", label: "Notifications", icon: FaBell },
  { id: "access", label: "Data Access", icon: FaShieldHalved },
  { id: "appearance", label: "Appearance", icon: FaPalette },
];

const hospitalTypes = [
  'General Hospital',
  'Multi-Specialty Hospital',
  'Super-Specialty Hospital',
  'Teaching / University Hospital',
  'Specialty Clinic / Hospital',
  'Community Hospital',
  'District / Regional Hospital',
  'Rehabilitation Hospital',
  'Psychiatric Hospital',
  'Critical Access Hospital',
];

const ownershipTypes = [
  'Government / Public Hospital',
  'Private Hospital',
  'Trust / Charitable Hospital',
  'Corporate Chain Hospital',
];

export function DoctorSettingsPage() {
  const { user } = useOutletContext();
  const { updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  // Profile — personal
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.mobileNumber || "");
  const [specialty, setSpecialty] = useState(user?.department || "");

  // Profile — hospital info
  const [hospitalName, setHospitalName] = useState(user?.hospitalName || user?.hospital || "");
  const [hospitalType, setHospitalType] = useState(user?.hospitalType || "");
  const [ownershipType, setOwnershipType] = useState(user?.ownershipType || "");
  const [hospitalContact, setHospitalContact] = useState(user?.hospitalContact || "");
  const [hospitalAddress, setHospitalAddress] = useState(user?.hospitalAddress || "");

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

  // Saare saved preferences ek baar page load hote hi le aao
  useEffect(() => {
    let isMounted = true;

    async function loadPreferences() {
      try {
        const prefs = await fetchAllMyPreferences();
        if (!isMounted) return;

        if (prefs.twoFactor?.enabled !== undefined) {
          setTwoFactorEnabled(prefs.twoFactor.enabled);
        }
        if (prefs.notifications) {
          setNotifyHighRisk(prefs.notifications.notifyHighRisk ?? true);
          setNotifyPredictionReady(prefs.notifications.notifyPredictionReady ?? true);
          setNotifyFollowUp(prefs.notifications.notifyFollowUp ?? true);
          setNotifyWeeklySummary(prefs.notifications.notifyWeeklySummary ?? false);
        }
        if (prefs.appearance) {
          setDefaultTheme(prefs.appearance.defaultTheme ?? "light");
          setCompactLayout(prefs.appearance.compactLayout ?? false);
        }
      } catch (err) {
        console.error("Failed to load saved preferences:", err);
      }
    }

    loadPreferences();
    return () => { isMounted = false; };
  }, []);

  const flashSaved = (message = "Settings saved successfully.") => {
    setSavedMessage(message);
    setErrorMessage("");
    setTimeout(() => setSavedMessage(""), 2500);
  };

  const flashError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 3500);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    try {
      const updated = await updateMyProfile({
        fullName,
        email,
        mobileNumber: phone,
        department: specialty,
        hospitalName,
        hospitalType,
        ownershipType,
        hospitalContact,
        hospitalAddress,
      });

      updateUser({
        fullName: updated.fullName,
        email: updated.email,
        mobileNumber: updated.mobileNumber,
        department: updated.department,
        hospitalName: updated.hospitalName,
        hospital: updated.hospitalName,
        hospitalType: updated.hospitalType,
        ownershipType: updated.ownershipType,
        hospitalContact: updated.hospitalContact,
        hospitalAddress: updated.hospitalAddress,
      });

      flashSaved("Profile updated successfully.");
    } catch (err) {
      flashError(err?.message || "Failed to update profile.");
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
      await changeMyPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      flashSaved("Password changed successfully.");
    } catch (err) {
      setPasswordError(err?.message || "Failed to change password.");
    }
  };

  const handleToggleTwoFactor = async (checked) => {
    setTwoFactorEnabled(checked);
    try {
      await updateMyTwoFactor(checked);
    } catch (err) {
      flashError(err?.message || "Failed to update two-factor setting.");
    }
  };

  const handleSaveNotifications = async (event) => {
    event.preventDefault();
    try {
      await updateMyNotificationPreferences({
        notifyHighRisk,
        notifyPredictionReady,
        notifyFollowUp,
        notifyWeeklySummary,
      });
      flashSaved("Notification preferences updated.");
    } catch (err) {
      flashError(err?.message || "Failed to update notification preferences.");
    }
  };

  const handleSaveAppearance = async (event) => {
    event.preventDefault();
    try {
      await updateMyAppearancePreferences({ defaultTheme, compactLayout });
      flashSaved("Appearance settings updated.");
    } catch (err) {
      flashError(err?.message || "Failed to update appearance settings.");
    }
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

        <div className="settings-content" ref={contentRef}>
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
                  <span>Specialty / Department</span>
                  <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                </label>

                <label className="form-field">
                  <span>Role</span>
                  <input type="text" value="Doctor" disabled />
                </label>
              </div>

              <div className="panel-header-row" style={{ marginTop: "24px" }}>
                <div>
                  <h2><FaHospital /> Hospital Information</h2>
                  <p>Details you provided during registration</p>
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
                    <option value="">Select Hospital Type</option>
                    {hospitalTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Ownership Type</span>
                  <select value={ownershipType} onChange={(e) => setOwnershipType(e.target.value)}>
                    <option value="">Select Ownership Type</option>
                    {ownershipTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Hospital Contact Number</span>
                  <input type="tel" value={hospitalContact} onChange={(e) => setHospitalContact(e.target.value)} />
                </label>

                <label className="form-field auth-field-full">
                  <span>Hospital Address</span>
                  <input type="text" value={hospitalAddress} onChange={(e) => setHospitalAddress(e.target.value)} />
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

          {/* DATA ACCESS - read only */}
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
                    <tr><td>Patient Records</td><td>Assigned Patients Only</td></tr>
                    <tr><td>Medical History</td><td>Assigned Patients Only</td></tr>
                    <tr><td>Risk Prediction Reports</td><td>Full Access</td></tr>
                    <tr><td>Readmission Forecasts</td><td>Full Access</td></tr>
                    <tr><td>Treatment Effectiveness Reports</td><td>Full Access</td></tr>
                    <tr><td>Care Recommendations</td><td>Full Access</td></tr>
                    <tr><td>Hospital Analytics Dashboard</td><td>Limited</td></tr>
                    <tr><td>User Management</td><td>No Access</td></tr>
                    <tr><td>AI Model Management</td><td>No Access</td></tr>
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