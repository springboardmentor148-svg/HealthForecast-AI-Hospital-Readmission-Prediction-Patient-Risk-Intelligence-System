import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  HeartPulse, 
  BarChart3, 
  Cpu, 
  UserCircle,
  Activity,
  LogOut,
  Sparkles,
  History
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, ROLE_PERMISSIONS, PERMISSIONS } from '../config/rbac';
import { getUserInitials } from '../utils/auth';
import Badge from './Badge';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Patients', path: '/patients', icon: Users, permission: PERMISSIONS.VIEW_PATIENTS },
  { label: 'Predictions', path: '/predictions', icon: Sparkles, permission: PERMISSIONS.RUN_PREDICTIONS },
  { label: 'Prediction History', path: '/predictions/history', icon: History, permission: PERMISSIONS.RUN_PREDICTIONS },
  { label: 'Treatment Metrics', path: '/treatment-effectiveness', icon: Activity, permission: PERMISSIONS.VIEW_TREATMENT_EFFECTIVENESS },
  { label: 'Clinical Support', path: '/clinical-support', icon: HeartPulse, permission: PERMISSIONS.VIEW_MEDICAL_HISTORY },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, permission: PERMISSIONS.VIEW_POPULATION_HEALTH },
  { label: 'Profile', path: '/profile', icon: UserCircle },
];

export default function Sidebar() {
  const { currentRole, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  
  const activeStyle = "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold bg-sidebar-active-bg text-sidebar-active-text transition-all shadow-sm";
  const inactiveStyle = "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-txt-muted hover:bg-borderColor/30 hover:text-txt-primary transition-all";

  const hasPermission = (permission) => {
    const permissions = ROLE_PERMISSIONS[currentRole] || [];
    return permissions.includes(permission);
  };

  const isLinkActive = (path) => {
    const currentPath = window.location.pathname;
    if (path === '/predictions') {
      return currentPath === '/predictions' || (currentPath.startsWith('/predictions/') && currentPath !== '/predictions/history');
    }
    if (path === '/predictions/history') {
      return currentPath === '/predictions/history';
    }
    if (path === '/patients') {
      return currentPath === '/patients' || currentPath.startsWith('/patients/');
    }
    return currentPath === path;
  };

  const visibleItems = navItems.filter(item => !item.permission || hasPermission(item.permission));

  return (
    <aside className="w-[260px] bg-sidebar-bg border-r border-borderColor h-screen flex flex-col justify-between p-4 flex-shrink-0">
      <div className="space-y-6 overflow-y-auto no-scrollbar flex-1">
        {/* App Logo */}
        <div className="flex items-center gap-2.5 px-2.5 py-1.5 border-b border-borderColor/50 pb-4">
          <div className="bg-info text-surface p-2 rounded-xl">
            <Activity className="w-5 h-5 animate-pulse" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-txt-primary leading-none tracking-tight">HealthForecast</span>
            <span className="text-[11px] font-semibold text-info tracking-wider uppercase mt-0.5">Risk Intelligence</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1.5">
          <span className="text-[11px] font-bold text-txt-muted/70 uppercase tracking-wider px-3 block mb-2">
            Clinical Modules
          </span>
          <ul className="space-y-1">
            {visibleItems.map((item, idx) => {
              const Icon = item.icon;
              const active = isLinkActive(item.path);
              return (
                <li key={idx}>
                  <NavLink 
                    to={item.path} 
                    className={active ? activeStyle : inactiveStyle}
                  >
                    <Icon className="w-4.5 h-4.5" strokeWidth={2} />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Role Switcher Select & Pinned User Card */}
      <div className="border-t border-borderColor pt-4 mt-auto space-y-4">
        {/* User profile card details */}
        <div className="flex items-center justify-between gap-2.5 bg-surface p-3 rounded-2xl border border-borderColor shadow-card">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full bg-info text-surface font-bold text-[14px] flex items-center justify-center border border-borderColor/20 flex-shrink-0">
              {getUserInitials(user?.full_name)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-bold text-txt-primary truncate">
                {user?.full_name || 'Authenticated User'}
              </span>
              <span className="text-[11px] text-txt-muted truncate leading-tight mb-1">{user?.email || ''}</span>
              <Badge tone={currentRole === ROLES.DOCTOR ? 'info' : currentRole === ROLES.SYSTEM_ADMIN ? 'danger' : 'warning'} className="text-[10px] py-0 px-1.5 self-start font-bold uppercase">
                {currentRole.split(' ')[0]}
              </Badge>
            </div>
          </div>
          
          <button 
            onClick={() => setShowSignOutConfirm(true)}
            title="Sign Out"
            className="p-1.5 text-txt-muted hover:text-danger hover:bg-danger-bg/25 rounded-xl transition-all cursor-pointer flex-shrink-0"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showSignOutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of HealthForecast AI?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
          onConfirm={async () => {
          logout();
          setShowSignOutConfirm(false);
          navigate('/login');
          }}
        onCancel={() => setShowSignOutConfirm(false)}
        variant="default"
      />
    </aside>
  );
}
