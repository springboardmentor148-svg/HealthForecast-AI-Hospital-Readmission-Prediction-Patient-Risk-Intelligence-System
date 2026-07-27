import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { useToast } from '../components/Toast';
import { User, Lock, Shield, Calendar } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  doctor: 'Doctor', hospital_administrator: 'Hospital Administrator',
  healthcare_researcher: 'Healthcare Researcher', system_administrator: 'System Administrator',
};

const Profile: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const { success, error: showError } = useToast();
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwLoading, setPwLoading] = useState(false);

  const initials = user?.full_name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!pwForm.old_password) errs.old_password = 'Current password required';
    if (pwForm.new_password.length < 8) errs.new_password = 'Minimum 8 characters';
    if (pwForm.new_password !== pwForm.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setPwLoading(true);
    try {
      await authApi.changePassword(pwForm.old_password, pwForm.new_password);
      success('Password changed successfully!');
      setPwForm({ old_password: '', new_password: '', confirm: '' });
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Failed to change password');
    } finally { setPwLoading(false); }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account information and security</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Profile Card */}
        <div className="card">
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: 22, background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: 'white' }}>{initials}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{user?.full_name}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{user?.email}</div>
              <span className="badge badge-primary" style={{ marginTop: 8 }}>{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</span>
            </div>
            <div className="divider" style={{ width: '100%' }} />
            <div style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { icon: <User size={14} />, label: 'Hospital', value: user?.hospital_name ?? '—' },
                { icon: <Shield size={14} />, label: 'Department', value: user?.department ?? '—' },
                { icon: <User size={14} />, label: 'Phone', value: user?.phone ?? '—' },
                { icon: <Calendar size={14} />, label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>{icon}{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ width: '100%', padding: '10px 14px', background: user?.is_active ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: user?.is_active ? 'var(--color-accent)' : 'var(--color-danger)' }}>
              <Shield size={14} />{user?.is_active ? 'Account Active' : 'Account Inactive'}
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={16} color="var(--color-primary)" />
              <h3 className="card-title">Change Password</h3>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Current Password', key: 'old_password' },
                { label: 'New Password', key: 'new_password' },
                { label: 'Confirm New Password', key: 'confirm' },
              ].map(({ label, key }) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <input className="form-input" type="password" value={(pwForm as any)[key]} onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))} />
                  {(pwErrors as any)[key] && <div className="form-error">{(pwErrors as any)[key]}</div>}
                </div>
              ))}
              <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                {pwLoading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Updating...</> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
