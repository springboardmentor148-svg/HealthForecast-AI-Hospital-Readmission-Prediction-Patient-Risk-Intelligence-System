import React from 'react';
import { UserProfile, UserRole } from '../types';
import { DEMO_USERS } from '../mockData';
import { Activity, Shield, Users, Stethoscope, Building2, Microchip, Search, ChevronDown, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile;
  onRoleChange: (role: UserRole) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenNewPatient: () => void;
  onOpenRiskSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleChange,
  searchQuery,
  setSearchQuery,
  onOpenNewPatient,
  onOpenRiskSimulator,
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = React.useState(false);

  const roleIcons: Record<UserRole, React.ReactNode> = {
    doctor: <Stethoscope className="w-4 h-4 text-teal-600" />,
    hospital_admin: <Building2 className="w-4 h-4 text-indigo-600" />,
    researcher: <Users className="w-4 h-4 text-amber-600" />,
    sysadmin: <Microchip className="w-4 h-4 text-emerald-600" />,
  };

  const roleLabels: Record<UserRole, string> = {
    doctor: 'Doctor (Clinical)',
    hospital_admin: 'Hospital Administrator',
    researcher: 'Healthcare Researcher',
    sysadmin: 'System Administrator',
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Platform Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">HealthForecast<span className="text-teal-400">.AI</span></span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  ML & Risk Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Hospital Readmission & Patient Risk Intelligence</p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search MRN, patient name, diagnosis, or ICD-9..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
          </div>

          {/* Actions & Role Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenRiskSimulator}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Activity className="w-3.5 h-3.5" />
              Risk Simulator
            </button>

            <button
              onClick={onOpenNewPatient}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              + Patient Intake
            </button>

            {/* Role Switcher Menu */}
            <div className="relative">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 transition-all text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-600"
                />
                <div className="hidden lg:block">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                    {currentUser.name}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-[10px] text-teal-400 font-medium">
                    {roleLabels[currentUser.role]}
                  </div>
                </div>
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Switch Active Role (RBAC Demo)</p>
                    <p className="text-[10px] text-slate-500">Test platform permissions as different personas</p>
                  </div>
                  
                  {DEMO_USERS.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onRoleChange(user.role);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-800 text-left transition-colors ${
                        currentUser.role === user.role ? 'bg-slate-800/80' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={user.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                        <div>
                          <p className="font-semibold text-slate-200">{user.name}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            {roleIcons[user.role]}
                            {user.title}
                          </p>
                        </div>
                      </div>
                      {currentUser.role === user.role && (
                        <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
