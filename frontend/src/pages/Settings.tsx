import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Bell, Shield, Info, CheckSquare, Square } from 'lucide-react';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <div onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, background: checked ? 'var(--color-primary)' : 'var(--border-color)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: 3, left: checked ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
  </div>
);

const SettingRow: React.FC<{ icon: React.ReactNode; label: string; desc: string; action: React.ReactNode }> = ({ icon, label, desc, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
      </div>
    </div>
    {action}
  </div>
);

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [notifs, setNotifs] = useState({ email: true, highRisk: true, weeklyReport: false });
  const toggle = (k: keyof typeof notifs) => setNotifs((n) => ({ ...n, [k]: !n[k] }));

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customize your HealthForecast AI experience</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="card mb-4">
        <div className="card-header"><h3 className="card-title">Appearance</h3></div>
        <div className="card-body">
          <SettingRow
            icon={theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            label="Theme"
            desc={`Currently using ${theme === 'dark' ? 'Dark' : 'Light'} mode`}
            action={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{theme === 'dark' ? 'Dark' : 'Light'}</span>
                <ToggleSwitch checked={theme === 'dark'} onChange={toggleTheme} />
              </div>
            }
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="card mb-4">
        <div className="card-header"><h3 className="card-title">Notifications</h3></div>
        <div className="card-body">
          <SettingRow icon={<Bell size={16} />} label="Email Notifications" desc="Receive updates about patients via email" action={<ToggleSwitch checked={notifs.email} onChange={() => toggle('email')} />} />
          <SettingRow icon={<Bell size={16} />} label="High Risk Alerts" desc="Immediate alerts for critical readmission risk" action={<ToggleSwitch checked={notifs.highRisk} onChange={() => toggle('highRisk')} />} />
          <SettingRow icon={<Bell size={16} />} label="Weekly Reports" desc="Automated weekly summary reports" action={<ToggleSwitch checked={notifs.weeklyReport} onChange={() => toggle('weeklyReport')} />} />
        </div>
      </div>

      {/* Security */}
      <div className="card mb-4">
        <div className="card-header"><h3 className="card-title">Security</h3></div>
        <div className="card-body">
          <SettingRow icon={<Shield size={16} />} label="Session Management" desc="JWT-based stateless authentication (30 min access token)" action={<span className="badge badge-success">Active</span>} />
          <SettingRow icon={<Shield size={16} />} label="Refresh Token" desc="7-day refresh token stored in localStorage" action={<span className="badge badge-warning">7 days</span>} />
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="card-header"><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Info size={16} color="var(--color-primary)" /><h3 className="card-title">About</h3></div></div>
        <div className="card-body">
          {[
            { label: 'Application', value: 'HealthForecast AI' },
            { label: 'Version', value: '1.0.0' },
            { label: 'Backend', value: 'FastAPI + SQLAlchemy' },
            { label: 'ML Model', value: 'XGBoost v1.0.0' },
            { label: 'Frontend', value: 'Vite + React 18 + TypeScript' },
            { label: 'API Base URL', value: '/api/v1' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, fontFamily: value.includes('/') ? 'monospace' : 'inherit' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
