import { useEffect, useState } from "react";
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
} from "react-icons/fa6";
import {
  updateMyProfile,
  changeMyPassword,
  fetchAllMyPreferences,
  updateMyTwoFactor,
  updateMyNotificationPreferences,
  updateMyAppearancePreferences,
} from "../services/userApi";

const tabs = [
  { id: "profile", label: "Profile", icon: FaUser },
  { id: "security", label: "Security & Password", icon: FaLock },
  { id: "notifications", label: "Notifications", icon: FaBell },
  { id: "access", label: "Data Access", icon: FaShieldHalved },
  { id: "appearance", label: "Appearance", icon: FaPalette },
];

export function ResearcherSettingsPage() {
  const { user } = useOutletContext();
  const { updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [savedMessage, setSavedMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [notifyNewDataset, setNotifyNewDataset] = useState(true);
  const [notifyExportComplete, setNotifyExportComplete] = useState(true);
  const [notifyStudyUpdate, setNotifyStudyUpdate] = useState(true);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  const [defaultTheme, setDefaultTheme] = useState("light");
  const [compactLayout, setCompactLayout] = useState(false);
  const [savingAppearance, setSavingAppearance] = useState(false);

  useEffect(() => {
    fetchAllMyPreferences()
      .then((data) => {
        if (data.twoFactor && typeof data.twoFactor.enabled === "boolean") {
          setTwoFactorEnabled(data.twoFactor.enabled);
        }

        if (data.notifications) {
          const n = data.notifications;
          if (typeof n.newDataset === "boolean") setNotifyNewDataset(n.newDataset);
          if (typeof n.exportComplete === "boolean") setNotifyExportComplete(n.exportComplete);
          if (typeof n.studyUpdate === "boolean") setNotifyStudyUpdate(n.studyUpdate);
          if (typeof n.weeklyDigest === "boolean") setNotifyWeeklyDigest(n.weeklyDigest);
        }

        if (data.appearance) {
          if (data.appearance.theme) setDefaultTheme(data.appearance.theme);
          if (typeof data.appearance.compactLayout === "boolean") {
            setCompactLayout(data.appearance.compactLayout);
          }
        }
      })
      .catch(() => setLoadError("Could not load your saved preferences. Showing defaults."))
      .finally(() => setLoading(false));
  }, []);

  const flashSaved = (message = "Settings saved successfully.") => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(""), 2500);
  };

 const handleSaveProfile = async (event) => {
  event.preventDefault();
  setSavingProfile(true);
  try {
    const updated = await updateMyProfile({ fullName, email, mobileNumber });
    updateUser({
      fullName: updated.fullName,
      email: updated.email,
      mobileNumber: updated.mobileNumber,
    });
    flashSaved("Profile updated successfully.");
  } catch (err) {
    setLoadError(err.message || "Could not update profile. Please try again.");
  } finally {
    setSavingProfile(false);
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

    setSavingPassword(true);
    try {
      await changeMyPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      flashSaved("Password changed successfully.");
    } catch (err) {
      setPasswordError(err.message || "Could not change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleTwoFactor = async (checked) => {
    setTwoFactorEnabled(checked);
    try {
      await updateMyTwoFactor(checked);
    } catch (err) {
      setTwoFactorEnabled(!checked);
      setLoadError(err.message || "Could not update two-factor setting.");
    }
  };

  const handleSaveNotifications = async (event) => {
    event.preventDefault();
    setSavingNotifications(true);
    try {
      await updateMyNotificationPreferences({
        newDataset: notifyNewDataset,
        exportComplete: notifyExportComplete,
        studyUpdate: notifyStudyUpdate,
        weeklyDigest: notifyWeeklyDigest,
      });
      flashSaved("Notification preferences updated.");
    } catch (err) {
      setLoadError(err.message || "Could not save notification preferences.");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSaveAppearance = async (event) => {
    event.preventDefault();
    setSavingAppearance(true);
    try {
      await updateMyAppearancePreferences({
        theme: defaultTheme,
        compactLayout,
      });
      flashSaved("Appearance settings updated.");
    } catch (err) {
      setLoadError(err.message || "Could not save appearance settings.");
    } finally {
      setSavingAppearance(false);
    }
  };

  if (loading) {
    return <p style={{ padding: "24px" }}>Loading settings...</p>;
  }

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
          {loadError && <div className="settings-error-banner">{loadError}</div>}

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
                  <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                </label>

                <label className="form-field">
                  <span>Role</span>
                  <input type="text" value="Healthcare Researcher" disabled />
                </label>
              </div>

              <div className="dashboard-inline-actions">
                <button type="submit" className="primary-button" disabled={savingProfile}>
                  <FaFloppyDisk /> {savingProfile ? "Saving..." : "Save Profile"}
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
                  <button type="submit" className="primary-button" disabled={savingPassword}>
                    <FaFloppyDisk /> {savingPassword ? "Updating..." : "Update Password"}
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
                    checked={notifyNewDataset}
                    onChange={(e) => setNotifyNewDataset(e.target.checked)}
                  />
                  <span>New anonymized dataset available</span>
                </label>
                <label className="settings-toggle-row">
                  <input
                    type="checkbox"
                    checked={notifyExportComplete}
                    onChange={(e) => setNotifyExportComplete(e.target.checked)}
                  />
                  <span>Dataset export completed</span>
                </label>
                <label className="settings-toggle-row">
                  <input
                    type="checkbox"
                    checked={notifyStudyUpdate}
                    onChange={(e) => setNotifyStudyUpdate(e.target.checked)}
                  />
                  <span>Active study status updates</span>
                </label>
                <label className="settings-toggle-row">
                  <input
                    type="checkbox"
                    checked={notifyWeeklyDigest}
                    onChange={(e) => setNotifyWeeklyDigest(e.target.checked)}
                  />
                  <span>Weekly research activity digest</span>
                </label>
              </div>

              <div className="dashboard-inline-actions">
                <button type="submit" className="primary-button" disabled={savingNotifications}>
                  <FaFloppyDisk /> {savingNotifications ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          )}

          {/* DATA ACCESS - read only info, researcher can't edit permissions */}
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
                      <td>Anonymized Only</td>
                    </tr>
                    <tr>
                      <td>Risk Prediction Reports</td>
                      <td>Aggregated Only</td>
                    </tr>
                    <tr>
                      <td>Readmission Forecasts</td>
                      <td>Aggregated Only</td>
                    </tr>
                    <tr>
                      <td>Treatment Effectiveness Reports</td>
                      <td>Full Access</td>
                    </tr>
                    <tr>
                      <td>Research Dataset Export</td>
                      <td>Full Access</td>
                    </tr>
                    <tr>
                      <td>Personally Identifiable Information</td>
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
                <button type="submit" className="primary-button" disabled={savingAppearance}>
                  <FaFloppyDisk /> {savingAppearance ? "Saving..." : "Save Appearance"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}