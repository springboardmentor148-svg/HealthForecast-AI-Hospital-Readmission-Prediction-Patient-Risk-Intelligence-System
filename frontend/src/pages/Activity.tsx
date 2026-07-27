import React, { useState } from 'react';
import { Bell, AlertTriangle, Brain, FileText, Shield, Info, X } from 'lucide-react';

type NotifType = 'alert' | 'prediction' | 'report' | 'system' | 'security';
type Tab = 'all' | 'unread' | 'alerts' | 'system';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}

const ICONS: Record<NotifType, React.ReactNode> = {
  alert:      <AlertTriangle size={16} color="#EF4444" />,
  prediction: <Brain size={16} color="var(--color-primary)" />,
  report:     <FileText size={16} color="var(--color-secondary)" />,
  security:   <Shield size={16} color="var(--color-warning)" />,
  system:     <Info size={16} color="var(--text-muted)" />,
};

const BG: Record<NotifType, string> = {
  alert: 'rgba(239,68,68,0.08)', prediction: 'rgba(37,99,235,0.08)',
  report: 'rgba(20,184,166,0.08)', security: 'rgba(245,158,11,0.08)', system: 'var(--bg-hover)',
};

const INITIAL: Notification[] = [
  { id: '1', type: 'alert', title: 'Critical Risk Alert', description: 'Patient John Doe has a critical readmission risk (92%). Immediate intervention recommended.', time: '2 hours ago', unread: true },
  { id: '2', type: 'prediction', title: 'Prediction Completed', description: 'AI risk analysis completed for patient Sarah Johnson. Risk level: Moderate (61%).', time: '4 hours ago', unread: true },
  { id: '3', type: 'alert', title: 'High Risk Patient Flagged', description: 'Patient Michael Chen flagged as high risk based on recent inpatient visit history.', time: '6 hours ago', unread: true },
  { id: '4', type: 'report', title: 'Report Generated', description: 'Monthly Risk Analysis PDF report has been generated and is ready for download.', time: '1 day ago', unread: false },
  { id: '5', type: 'security', title: 'Login from New Device', description: 'A login was detected from a new device (Chrome / Windows). If this was not you, change your password.', time: '2 days ago', unread: false },
  { id: '6', type: 'system', title: 'System Update', description: 'XGBoost model v1.0.0 is active. Prediction accuracy: 87.3% on validation set.', time: '3 days ago', unread: false },
];

const Activity: React.FC = () => {
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL);
  const [tab, setTab] = useState<Tab>('all');

  const dismiss = (id: string) => setNotifs((n) => n.filter((x) => x.id !== id));
  const markRead = (id: string) => setNotifs((n) => n.map((x) => x.id === id ? { ...x, unread: false } : x));
  const markAllRead = () => setNotifs((n) => n.map((x) => ({ ...x, unread: false })));

  const filtered = notifs.filter((n) => {
    if (tab === 'unread') return n.unread;
    if (tab === 'alerts') return n.type === 'alert';
    if (tab === 'system') return n.type === 'system' || n.type === 'security';
    return true;
  });

  const unreadCount = notifs.filter((n) => n.unread).length;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity & Notifications</h1>
          <p className="page-subtitle">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost" onClick={markAllRead}>
            <Bell size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {([
          { key: 'all', label: `All (${notifs.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'alerts', label: 'Alerts' },
          { key: 'system', label: 'System' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button key={key} className={`tab-btn ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {/* Notifications */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!filtered.length ? (
          <div className="empty-state">
            <div className="empty-icon"><Bell size={40} /></div>
            <div className="empty-title">No notifications</div>
            <div className="empty-desc">You're all caught up!</div>
          </div>
        ) : (
          filtered.map((n) => (
            <div key={n.id} onClick={() => markRead(n.id)}
              style={{ display: 'flex', gap: 14, padding: '16px 18px', background: n.unread ? BG[n.type] : 'var(--bg-card)', border: `1px solid ${n.unread ? 'transparent' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all var(--transition)', position: 'relative' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: BG[n.type], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {ICONS[n.type]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontWeight: n.unread ? 700 : 500, fontSize: 14 }}>{n.title}</span>
                  {n.unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-primary)', flexShrink: 0 }} />}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 4 }}>{n.description}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.time}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); dismiss(n.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, flexShrink: 0, display: 'flex' }}><X size={14} /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Activity;
