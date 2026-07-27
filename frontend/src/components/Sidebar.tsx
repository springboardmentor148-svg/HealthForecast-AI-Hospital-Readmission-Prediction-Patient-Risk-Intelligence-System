import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Brain, BarChart3, FileText,
  Settings, LogOut, Menu, X, Activity, Bell, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard',   to: '/dashboard',   icon: LayoutDashboard },
  { label: 'Patients',    to: '/patients',    icon: Users },
  { label: 'AI Predict',  to: '/prediction',  icon: Brain },
  { label: 'Analytics',   to: '/analytics',   icon: BarChart3 },
  { label: 'Reports',     to: '/reports',     icon: FileText },
  { label: 'Activity',    to: '/activity',    icon: Activity },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Brain size={20} color="white" />
        </div>
        <span className="sidebar-brand">HealthForecast AI</span>
      </div>

      {/* Nav */}
      <div className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>

        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            data-tooltip={label}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: 12 }}>Account</div>

        <NavLink to="/profile" data-tooltip="Profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="user-avatar" style={{ width: 18, height: 18, fontSize: 9 }}>
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="nav-label">Profile</span>
        </NavLink>

        <NavLink to="/settings" data-tooltip="Settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={18} />
          <span className="nav-label">Settings</span>
        </NavLink>

        <button className="nav-item" style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', color: 'var(--color-danger)' }} data-tooltip="Logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span className="nav-label">Logout</span>
        </button>
      </div>

      {/* Collapse toggle */}
      <div className="sidebar-footer">
        <button className="collapse-btn" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
