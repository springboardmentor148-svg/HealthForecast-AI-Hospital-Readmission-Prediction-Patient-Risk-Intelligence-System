import React from 'react';
import { UserRole } from '../types';
import {
  Users,
  Activity,
  BarChart3,
  Pill,
  Database,
  Cpu,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

export type NavTab =
  | 'patients'
  | 'risk_simulator'
  | 'analytics'
  | 'treatment'
  | 'researcher'
  | 'model_ops'
  | 'rbac';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  userRole: UserRole;
  patientCount: number;
  highRiskCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  patientCount,
  highRiskCount,
}) => {
  const getTabsForRole = (): { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] => {
    const baseTabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [];

    // Doctor view
    if (userRole === 'doctor') {
      baseTabs.push(
        { id: 'patients', label: 'Patient Records', icon: <Users className="w-4 h-4" />, badge: `${patientCount}` },
        { id: 'risk_simulator', label: 'Risk Prediction Engine', icon: <Activity className="w-4 h-4" />, badge: `${highRiskCount} High Risk` },
        { id: 'treatment', label: 'Treatment Effectiveness', icon: <Pill className="w-4 h-4" /> },
        { id: 'analytics', label: 'Hospital Readmission Stats', icon: <BarChart3 className="w-4 h-4" /> }
      );
    }
    // Hospital Admin view
    else if (userRole === 'hospital_admin') {
      baseTabs.push(
        { id: 'analytics', label: 'Hospital Executive Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'patients', label: 'Hospital Patient Roster', icon: <Users className="w-4 h-4" />, badge: `${patientCount}` },
        { id: 'treatment', label: 'Treatment Effectiveness', icon: <Pill className="w-4 h-4" /> },
        { id: 'risk_simulator', label: 'Risk Forecasting Simulator', icon: <Activity className="w-4 h-4" /> }
      );
    }
    // Healthcare Researcher view
    else if (userRole === 'researcher') {
      baseTabs.push(
        { id: 'researcher', label: 'Diabetes 130 Dataset Cohort', icon: <Database className="w-4 h-4" />, badge: '101,766 Enc' },
        { id: 'treatment', label: 'Treatment Outcome Analytics', icon: <Pill className="w-4 h-4" /> },
        { id: 'analytics', label: 'Population Health Trends', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'patients', label: 'Anonymized Records', icon: <Users className="w-4 h-4" /> }
      );
    }
    // System Admin view
    else if (userRole === 'sysadmin') {
      baseTabs.push(
        { id: 'model_ops', label: 'AI Model Management', icon: <Cpu className="w-4 h-4" />, badge: 'v2.4.1' },
        { id: 'rbac', label: 'User Roles & Audit Logs', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'analytics', label: 'System Analytics', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'patients', label: 'All Patient Records', icon: <Users className="w-4 h-4" /> },
        { id: 'researcher', label: 'Dataset Management', icon: <Database className="w-4 h-4" /> }
      );
    }

    return baseTabs;
  };

  const tabs = getTabsForRole();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between p-4 shrink-0 hidden md:flex">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Clinical Navigation
          </p>
          <nav className="mt-3 space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm font-semibold'
                      : 'hover:bg-slate-800 hover:text-white text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        isActive
                          ? 'bg-teal-700 text-white'
                          : 'bg-slate-800 text-teal-400 border border-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dataset Footnote */}
      <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-400">Diabetes 130-US Hospitals</p>
        <p>101,766 Clinical Encounters</p>
        <p className="text-[10px] text-teal-500/80">XGBoost & Gemini Intelligence</p>
      </div>
    </aside>
  );
};
