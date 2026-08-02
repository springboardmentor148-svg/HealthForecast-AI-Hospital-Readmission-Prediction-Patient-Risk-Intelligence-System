import React, { useState } from 'react';
import { 
  containerStyle, 
  headerStyle, 
  subTextStyle, 
  sectionBoxStyle, 
  primaryBtnStyle 
} from '../styles';

export default function SettingsPage() {
  const [threshold, setThreshold] = useState(0.50);
  const [emailAlerts, setEmailAlerts] = useState(true);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2>User Roles & System Settings</h2>
        <p style={subTextStyle}>Configure platform preferences, alert thresholds, and security parameters.</p>
      </header>

      <div style={{ maxWidth: '600px' }}>
        <div style={sectionBoxStyle}>
          <h3>Prediction Threshold Settings</h3>
          <div style={{ marginTop: '15px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#334155' }}>
              High-Risk Probability Threshold: <strong>{Math.round(threshold * 100)}%</strong>
            </label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '10px' }}
            />
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
              Patients with predicted risk equal to or higher than {Math.round(threshold * 100)}% will be flagged as High Risk.
            </p>
          </div>

          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />

          <h3>Notifications</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <input
              type="checkbox"
              id="emailCheck"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <label htmlFor="emailCheck" style={{ fontSize: '14px', color: '#334155' }}>
              Send immediate email alert when high-risk readmission is detected
            </label>
          </div>

          <button onClick={() => alert('Settings Saved!')} style={{ ...primaryBtnStyle, marginTop: '25px', width: '100%' }}>
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}