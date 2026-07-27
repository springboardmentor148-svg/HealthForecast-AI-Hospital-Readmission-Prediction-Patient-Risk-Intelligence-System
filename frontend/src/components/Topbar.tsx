import React, { useState } from 'react';
import { Search, Bell, Sun, Moon, Plus, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface TopbarProps {
  sidebarCollapsed: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ sidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U';

  const roleName: Record<string, string> = {
    doctor: 'Doctor',
    hospital_administrator: 'Hospital Admin',
    healthcare_researcher: 'Researcher',
    system_administrator: 'System Admin',
  };

  return (
    <header className={`topbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Search */}
      <div className="topbar-search">
        <Search size={15} />
        <input placeholder="Search patients, records..." />
      </div>

      {/* Right actions */}
      <div className="topbar-actions">
        {/* Add Patient quick action */}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/patients/new')}
        >
          <Plus size={15} />
          Add Patient
        </button>

        {/* Theme toggle */}
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <button className="icon-btn" title="Notifications" onClick={() => navigate('/activity')}>
          <Bell size={16} />
          <span className="badge-dot" />
        </button>

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <div
            className="user-menu"
            onClick={() => setShowUserMenu((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowUserMenu((v) => !v)}
          >
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.full_name ?? 'User'}</div>
              <div className="user-role">{user ? (roleName[user.role] ?? user.role) : ''}</div>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </div>

          {showUserMenu && (
            <div
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                minWidth: 180, zIndex: 300, overflow: 'hidden',
              }}
              onMouseLeave={() => setShowUserMenu(false)}
            >
              {[
                { label: 'Profile', action: () => navigate('/profile') },
                { label: 'Settings', action: () => navigate('/settings') },
                { label: 'Logout', action: handleLogout, danger: true },
              ].map(({ label, action, danger }) => (
                <button
                  key={label}
                  onClick={() => { action(); setShowUserMenu(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 16px', fontSize: 14, fontWeight: 500,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: danger ? 'var(--color-danger)' : 'var(--text-primary)',
                    transition: 'background var(--transition)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
