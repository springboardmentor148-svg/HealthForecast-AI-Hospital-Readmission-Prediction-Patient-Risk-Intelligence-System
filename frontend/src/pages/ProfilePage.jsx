// TODO (Phase 6 - Backend Integration):
// - Connect profile updates (name, phone, photo) to backend user endpoints.
// - Persist preferences (notifications, theme, language) in database user settings.
// - Connect security controls (password changes, 2FA toggle, active session revocation) to auth server.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { meRequest } from '../api/auth';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { normalizeAuthUser } from '../utils/auth';
import { 
  Badge, 
  Button, 
  Select,
  Input,
  useToast
} from '../components';
import { 
  User, 
  Shield, 
  Settings, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  X,
  Mail,
  Phone,
  Building,
  Lock,
  Activity
} from 'lucide-react';

export default function ProfilePage() {
  const { currentRole, user: authUser, token, setUser } = useAuth();
  const { modelSummary } = useAnalytics();
  const { showToast } = useToast();

  const [profileUser, setProfileUser] = useState(authUser);

  useEffect(() => {
    let isActive = true;
    async function loadProfile() {
      if (!token) return;
      try {
        const response = await meRequest(token);
        if (!isActive) return;
        const normalized = normalizeAuthUser(response.user);
        setProfileUser(normalized);
        if (normalized) {
          setUser(normalized);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    }
    loadProfile();
    return () => {
      isActive = false;
    };
  }, [token, setUser]);

  const activeUser = profileUser || authUser;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  const handleEditClick = () => {
    setEditName(user.name);
    setEditPhone(user.phone);
    setIsEditing(true);
  };

  const handleSaveChanges = () => {
    if (!editName.trim()) {
      showToast({ message: 'Name field cannot be empty.', variant: 'error' });
      return;
    }
    const updatedUser = {
      ...activeUser,
      full_name: editName,
      phone: editPhone
    };
    setProfileUser(updatedUser);
    setUser(updatedUser);
    setIsEditing(false);
    showToast({ message: 'Profile details updated successfully.', variant: 'success' });
  };

  // Controlled UI placeholders state
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('system');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // Notification checkboxes
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifClinical, setNotifClinical] = useState(true);
  const [notifPredictions, setNotifPredictions] = useState(false);
  const [notifReports, setNotifReports] = useState(true);

  // Dynamic user details based on role selector context
  const getUserDetails = (role) => {
    const details = {
      name: activeUser?.full_name || 'Dr. Sarah Reed',
      email: activeUser?.email || 's.reed@forecast.ai',
      phone: activeUser?.phone || '+1 (555) 019-2831',
      empId: activeUser?.id ? `EMP-${activeUser.id}` : 'EMP-9201',
      hospital: 'Metropolitan Diabetes Center',
      status: 'Active',
      joined: '12 Mar 2025',
      lastLogin: 'Today, 10:24 AM',
      username: activeUser?.username || activeUser?.email?.split('@')[0] || 'sreed_forecast',
      dept: 'Endocrinology'
    };

    if (role === 'System Administrator') {
      if (!activeUser) {
        details.name = 'Thomas Vance';
        details.email = 't.vance@forecast.ai';
        details.username = 'tvance_admin';
      }
      details.dept = 'Information Technology';
    } else if (role === 'Hospital Administrator') {
      if (!activeUser) {
        details.name = 'Marcus Sterling';
        details.email = 'm.sterling@forecast.ai';
        details.username = 'msterling_ops';
      }
      details.dept = 'Hospital Operations';
    } else if (role === 'Healthcare Researcher') {
      if (!activeUser) {
        details.name = 'Elena Rostova';
        details.email = 'e.rostova@forecast.ai';
        details.username = 'erostova_research';
      }
      details.dept = 'Anonymized Research Pool';
    }

    return details;
  };

  const user = getUserDetails(currentRole);

  const getPermissions = (role) => {
    switch (role) {
      case 'Doctor':
        return {
          can: ['View Assigned Patients', 'Run Predictions', 'View Prediction History', 'Clinical Decision Support'],
          cannot: ['User Management', 'AI Model Management', 'System Configuration']
        };
      case 'Hospital Administrator':
        return {
          can: ['View Patient Directory (Full)', 'View Medical History (View-only)', 'Run Predictions', 'View Treatment Effectiveness', 'Access Hospital-wide Analytics'],
          cannot: ['User Management', 'AI Model Management', 'System Configuration']
        };
      case 'Healthcare Researcher':
        return {
          can: ['View Patient Directory (Anonymized)', 'View Treatment Effectiveness', 'Access Aggregate Analytics', 'Export Anonymized Research Datasets'],
          cannot: ['View Patient PII / Identities', 'Run Predictions', 'User Management', 'AI Model Management']
        };
      case 'System Administrator':
        return {
          can: ['Full Access to all Platform Modules', 'Add/Edit Patient Records', 'Manage User Accounts Directory', 'Configure and Deploy AI Models'],
          cannot: []
        };
      default:
        return { can: [], cannot: [] };
    }
  };

  const perms = getPermissions(currentRole);
  const currentModel = modelSummary?.current_model || null;

  const getModelStatusText = () => {
    if (!modelSummary) return 'No active model available';
    if (modelSummary.error) {
      if (modelSummary.status === 403) return 'Access Denied';
      return 'Error loading model';
    }
    if (modelSummary.model_loaded === false) return 'No active model available';
    return null;
  };

  const modelStatus = getModelStatusText();

  const roleTone = 
    currentRole === 'System Administrator' ? 'danger' :
    currentRole === 'Hospital Administrator' ? 'warning' :
    currentRole === 'Healthcare Researcher' ? 'secondary' : 'info';

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <h1 className="text-[20px] font-semibold text-txt-primary">User Account Settings</h1>
        <p className="text-[14px] text-txt-muted mt-1">Manage your account, security, preferences, and clinician profile.</p>
      </div>

      {/* SECTION 1 — PROFILE CARD */}
      <div className="bg-surface border border-borderColor rounded-2xl p-6 shadow-card flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 text-center md:text-left">
          {/* Circular avatar */}
          <div className="w-18 h-18 rounded-full bg-info-bg text-info font-bold text-[22px] flex items-center justify-center border border-info/20 shadow-inner">
            {user.name
              ? user.name
                  .split(' ')
                  .filter(Boolean)
                  .map((n) => n.replace(/[Dr.]/g, '')[0])
                  .filter(Boolean)
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'U'
              : 'U'}
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row items-center gap-2">
              {isEditing ? (
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 max-w-[200px]"
                />
              ) : (
                <span className="text-[18px] font-extrabold text-txt-primary">{user.name}</span>
              )}
              <Badge tone={roleTone} className="text-[9px] font-bold uppercase py-0.5 whitespace-nowrap">
                {currentRole}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] font-semibold text-txt-muted pl-0.5">
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>{user.dept} • {user.hospital}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {isEditing ? (
                  <Input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="h-8 max-w-[200px]"
                  />
                ) : (
                  <span>{user.phone}</span>
                )}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>ID: {user.empId}</span>
              </div>
            </div>
            
            <div className="pt-2 pl-0.5 flex justify-center md:justify-start">
              <Badge tone="success" className="text-[9px] font-bold uppercase">
                {user.status} Status
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2.5 shrink-0 self-center md:self-start">
          {isEditing ? (
            <>
              <Button 
                onClick={handleSaveChanges}
                variant="primary" 
                className="text-[12px] font-bold rounded-xl px-4 py-2"
              >
                Save
              </Button>
              <Button 
                onClick={() => setIsEditing(false)}
                variant="ghost" 
                className="text-[12px] font-bold border border-borderColor rounded-xl px-4 py-2 hover:bg-bg-app"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={handleEditClick}
                variant="ghost" 
                className="text-[12px] font-bold border border-borderColor rounded-xl px-4 py-2 hover:bg-bg-app"
              >
                Edit Profile
              </Button>
              <Button 
                onClick={() => showToast({ message: 'Photo uploading is currently disabled.', variant: 'info' })}
                variant="ghost" 
                className="text-[12px] font-bold border border-borderColor rounded-xl px-4 py-2 hover:bg-bg-app"
              >
                Change Photo
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Two-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 2 — ACCOUNT INFORMATION */}
        <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center gap-1.5 border-b border-borderColor/60 pb-3">
            <User className="w-4.5 h-4.5 text-info" />
            <h3 className="text-[15px] font-bold text-txt-primary">Account Information</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[12px] font-semibold">
            <div className="space-y-1">
              <span className="text-txt-muted text-[11px] uppercase tracking-wider block">Username</span>
              <span className="text-txt-primary bg-bg-app/40 border border-borderColor/40 rounded-xl px-3.5 py-2 block font-mono">
                {user.username}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-txt-muted text-[11px] uppercase tracking-wider block">Email Address</span>
              <span className="text-txt-primary bg-bg-app/40 border border-borderColor/40 rounded-xl px-3.5 py-2 block font-mono truncate">
                {user.email}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-txt-muted text-[11px] uppercase tracking-wider block">Employee ID</span>
              <span className="text-txt-primary bg-bg-app/40 border border-borderColor/40 rounded-xl px-3.5 py-2 block font-mono">
                {user.empId}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-txt-muted text-[11px] uppercase tracking-wider block">Assigned Scope</span>
              <span className="text-txt-primary bg-bg-app/40 border border-borderColor/40 rounded-xl px-3.5 py-2 block">
                {user.dept}
              </span>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <span className="text-txt-muted text-[11px] uppercase tracking-wider block">Hospital Organization</span>
              <span className="text-txt-primary bg-bg-app/40 border border-borderColor/40 rounded-xl px-3.5 py-2 block">
                {user.hospital}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-txt-muted text-[11px] uppercase tracking-wider block">Date Joined</span>
              <span className="text-txt-primary bg-bg-app/40 border border-borderColor/40 rounded-xl px-3.5 py-2 block font-mono">
                {user.joined}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-txt-muted text-[11px] uppercase tracking-wider block">Last Login Timestamp</span>
              <span className="text-txt-primary bg-bg-app/40 border border-borderColor/40 rounded-xl px-3.5 py-2 block font-mono">
                {user.lastLogin}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3 — SECURITY */}
        <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center gap-1.5 border-b border-borderColor/60 pb-3">
            <Lock className="w-4.5 h-4.5 text-info" />
            <h3 className="text-[15px] font-bold text-txt-primary">Security Settings</h3>
          </div>

          <div className="space-y-4 text-[12px] font-semibold">
            {/* Change Password Actions */}
            <div className="flex items-center justify-between border-b border-borderColor/40 pb-3.5">
              <div>
                <span className="text-txt-primary block font-bold">Credential Settings</span>
                <span className="text-txt-muted text-[11px] block mt-0.5">Change password and auth key tokens.</span>
              </div>
              <Button 
                onClick={() => showToast({ message: 'Password reset placeholder.', variant: 'info' })}
                variant="ghost" 
                className="text-[11px] font-bold border border-borderColor rounded-lg px-3 py-1.5 hover:bg-bg-app"
              >
                Change Password
              </Button>
            </div>

            {/* 2FA Toggle */}
            <div className="flex items-center justify-between border-b border-borderColor/40 pb-3.5">
              <div>
                <span className="text-txt-primary block font-bold">Two-Factor Authentication (2FA)</span>
                <span className="text-txt-muted text-[11px] block mt-0.5">Secure logins with validation emails.</span>
              </div>
              <button 
                onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                className="bg-transparent border-none p-1 cursor-pointer"
              >
                {twoFactorAuth ? (
                  <ToggleRight className="w-10 h-6 text-success" />
                ) : (
                  <ToggleLeft className="w-10 h-6 text-txt-muted" />
                )}
              </button>
            </div>

            {/* Active Sessions info */}
            <div className="space-y-2">
              <span className="text-txt-muted text-[11px] uppercase tracking-wider block">Active Clinical Sessions</span>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-bg-app/40 border border-borderColor/40 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-txt-primary block font-bold">Chrome Mac OS (Current)</span>
                    <span className="text-txt-muted text-[10px] block font-mono">127.0.0.1 • Active now</span>
                  </div>
                  <span className="text-[10px] text-success font-bold uppercase tracking-wider bg-success-bg/25 px-2 py-0.5 rounded-full">
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-bg-app/40 border border-borderColor/40 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-txt-primary block font-bold">Firefox Windows 11</span>
                    <span className="text-txt-muted text-[10px] block font-mono">192.168.1.105 • 2 days ago</span>
                  </div>
                  <button 
                    onClick={() => showToast({ message: 'Session token revoked successfully.', variant: 'success' })}
                    className="text-[10px] font-bold text-danger hover:underline bg-transparent border-none cursor-pointer"
                  >
                    Revoke
                  </button>
                </div>
              </div>
              
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => showToast({ message: 'All other session keys revoked successfully.', variant: 'success' })}
                  className="text-[11px] text-info hover:underline bg-transparent border-none font-bold cursor-pointer"
                >
                  Logout Other Devices
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4 — PREFERENCES */}
        <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center gap-1.5 border-b border-borderColor/60 pb-3">
            <Settings className="w-4.5 h-4.5 text-info" />
            <h3 className="text-[15px] font-bold text-txt-primary">Preferences</h3>
          </div>

          <div className="space-y-4 text-[12px] font-semibold">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-txt-muted uppercase tracking-wider block pl-1">Theme Mode</label>
                <Select
                  id="theme-select"
                  options={[
                    { value: 'system', label: 'System Default' },
                    { value: 'light', label: 'Light Mode' },
                    { value: 'dark', label: 'Dark Mode' }
                  ]}
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="h-9.5 text-[12px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-txt-muted uppercase tracking-wider block pl-1">Language</label>
                <Select
                  id="lang-select"
                  options={[
                    { value: 'en', label: 'English (US)' },
                    { value: 'es', label: 'Spanish' }
                  ]}
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="h-9.5 text-[12px]"
                />
              </div>
            </div>

            {/* Checkboxes notification settings */}
            <div className="space-y-2 pt-2 border-t border-borderColor/40">
              <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider block pl-1">Notification Dispatch</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-txt-primary select-none">
                  <input
                    type="checkbox"
                    checked={notifEmail}
                    onChange={(e) => setNotifEmail(e.target.checked)}
                    className="w-4.5 h-4.5 accent-info cursor-pointer rounded border-borderColor"
                  />
                  <span>Email Notifications</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-txt-primary select-none">
                  <input
                    type="checkbox"
                    checked={notifClinical}
                    onChange={(e) => setNotifClinical(e.target.checked)}
                    className="w-4.5 h-4.5 accent-info cursor-pointer rounded border-borderColor"
                  />
                  <span>Clinical Alerts</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-txt-primary select-none">
                  <input
                    type="checkbox"
                    checked={notifPredictions}
                    onChange={(e) => setNotifPredictions(e.target.checked)}
                    className="w-4.5 h-4.5 accent-info cursor-pointer rounded border-borderColor"
                  />
                  <span>Prediction Completions</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-txt-primary select-none">
                  <input
                    type="checkbox"
                    checked={notifReports}
                    onChange={(e) => setNotifReports(e.target.checked)}
                    className="w-4.5 h-4.5 accent-info cursor-pointer rounded border-borderColor"
                  />
                  <span>Weekly Summary Reports</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5 — ROLE & PERMISSIONS */}
        <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center gap-1.5 border-b border-borderColor/60 pb-3">
            <ShieldCheck className="w-4.5 h-4.5 text-info" />
            <h3 className="text-[15px] font-bold text-txt-primary">Role & Clearances</h3>
          </div>

          <div className="space-y-4 text-[12px] font-semibold">
            <div className="flex justify-between items-center bg-bg-app/40 border border-borderColor/40 p-3 rounded-xl">
              <div>
                <span className="text-[11px] text-txt-muted uppercase tracking-wider block">Assigned Active Security Profile</span>
                <span className="text-[14px] font-extrabold text-txt-primary mt-0.5 block">{currentRole}</span>
              </div>
              <Badge tone={roleTone} className="text-[9px] font-bold uppercase py-0.5">
                RBAC Active
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="font-bold text-success flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" /> Authorized Scope
                </span>
                {perms.can.length > 0 ? (
                  <ul className="space-y-1 text-txt-primary pl-1 font-semibold leading-normal">
                    {perms.can.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                        <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-txt-muted italic">None</span>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="font-bold text-danger flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" /> Restricted Scope
                </span>
                {perms.cannot.length > 0 ? (
                  <ul className="space-y-1 text-txt-muted pl-1 font-semibold leading-normal">
                    {perms.cannot.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                        <X className="w-3.5 h-3.5 text-danger shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-success font-bold flex items-center gap-0.5 text-[11px]">
                    <Check className="w-3.5 h-3.5" /> Full Root Access
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 6 — RECENT ACTIVITY */}
      <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex items-center gap-1.5 border-b border-borderColor/60 pb-3">
          <Clock className="w-4.5 h-4.5 text-info" />
          <h3 className="text-[15px] font-bold text-txt-primary">Recent Account Activity</h3>
        </div>

        <div className="space-y-4 pl-2.5">
          <div className="relative border-l border-borderColor pl-6 space-y-5">
            <div className="relative">
              <span className="absolute -left-[30px] top-0 w-3 h-3 rounded-full bg-info border border-surface shadow-sm" />
              <div className="space-y-0.5">
                <span className="text-[13px] font-bold text-txt-primary block">Viewed Patient Dossier #82014</span>
                <span className="text-[10px] text-txt-muted block">2 minutes ago • Clinical Portal Session</span>
              </div>
            </div>

            <div className="relative">
              <span className="absolute -left-[30px] top-0 w-3 h-3 rounded-full bg-info border border-surface shadow-sm" />
              <div className="space-y-0.5">
                <span className="text-[13px] font-bold text-txt-primary block">Generated Readmission Prediction</span>
                <span className="text-[10px] text-txt-muted block">18 minutes ago • Predict workflow module</span>
              </div>
            </div>

            <div className="relative">
              <span className="absolute -left-[30px] top-0 w-3 h-3 rounded-full bg-info border border-surface shadow-sm" />
              <div className="space-y-0.5">
                <span className="text-[13px] font-bold text-txt-primary block">Updated Treatment Notes (Patient #82014)</span>
                <span className="text-[10px] text-txt-muted block">Yesterday, 4:15 PM • Clinical Support documentation</span>
              </div>
            </div>

            <div className="relative">
              <span className="absolute -left-[30px] top-0 w-3 h-3 rounded-full bg-info border border-surface shadow-sm" />
              <div className="space-y-0.5">
                <span className="text-[13px] font-bold text-txt-primary block">Downloaded Analytics Report</span>
                <span className="text-[10px] text-txt-muted block">3 days ago • Population Health metrics export</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 7 — APPLICATION INFO */}
      <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-info text-surface p-1.5 rounded-lg flex-shrink-0">
            <Activity className="w-5 h-5 animate-pulse" strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="text-[13px] font-extrabold text-txt-primary leading-tight">HealthForecast AI</h4>
            <span className="text-[10px] text-txt-muted block">Hospital Readmission Prediction Platform</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-[11px] font-semibold text-txt-muted font-mono bg-bg-app/40 border border-borderColor/40 px-4 py-2 rounded-xl">
          <div>
            <span>Version: </span>
            <span className="text-txt-primary">{modelStatus ? '—' : (currentModel?.model_version || '—')}</span>
          </div>
          <div className="hidden sm:block text-borderColor">|</div>
          <div>
            <span>Model: </span>
            <span className="text-txt-primary">{modelStatus ? modelStatus : (currentModel?.version || 'No active model available')}</span>
          </div>
          <div className="hidden sm:block text-borderColor">|</div>
          <div>
            <span>Accuracy: </span>
            <span className="text-txt-primary">{modelStatus ? modelStatus : (currentModel?.accuracy || 'No active model available')}</span>
          </div>
          <div className="hidden sm:block text-borderColor">|</div>
          <div>
            <span>ROC-AUC: </span>
            <span className="text-txt-primary">{modelStatus ? modelStatus : (currentModel?.roc_auc || 'No active model available')}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
