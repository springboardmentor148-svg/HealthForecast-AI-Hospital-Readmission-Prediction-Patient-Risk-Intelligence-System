import React from 'react';
import { AuditLogEntry, UserRole } from '../types';
import { ShieldCheck, Lock, Check, X, FileText, UserCheck, Eye, ShieldAlert } from 'lucide-react';

interface UserManagementRBACViewProps {
  auditLogs: AuditLogEntry[];
}

export const UserManagementRBACView: React.FC<UserManagementRBACViewProps> = ({ auditLogs }) => {
  const accessMatrix = [
    { feature: 'Patient Records', doctor: 'Assigned Patients Only', admin: 'View Only', researcher: 'Anonymized Only', sysadmin: 'Full Access (Yes)' },
    { feature: 'Medical History', doctor: 'Assigned Patients Only', admin: 'View Only', researcher: 'Anonymized Only', sysadmin: 'Full Access (Yes)' },
    { feature: 'Risk Prediction Reports', doctor: 'Full Access (Yes)', admin: 'Full Access (Yes)', researcher: 'Aggregated Only', sysadmin: 'Full Access (Yes)' },
    { feature: 'Readmission Forecasts', doctor: 'Full Access (Yes)', admin: 'Full Access (Yes)', researcher: 'Aggregated Only', sysadmin: 'Full Access (Yes)' },
    { feature: 'Treatment Effectiveness Reports', doctor: 'Full Access (Yes)', admin: 'Full Access (Yes)', researcher: 'Full Access (Yes)', sysadmin: 'Full Access (Yes)' },
    { feature: 'Hospital Analytics Dashboard', doctor: 'Limited View', admin: 'Full Access', researcher: 'Aggregated Only', sysadmin: 'Full Access' },
    { feature: 'Population Health Reports', doctor: 'No', admin: 'Yes', researcher: 'Yes', sysadmin: 'Yes' },
    { feature: 'Research Dataset Export', doctor: 'No', admin: 'No', researcher: 'Yes', sysadmin: 'Yes' },
    { feature: 'User Management', doctor: 'No', admin: 'No', researcher: 'No', sysadmin: 'Yes' },
    { feature: 'Model Management & MLOps', doctor: 'No', admin: 'No', researcher: 'No', sysadmin: 'Yes' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Role-Based Access Control (RBAC) & Governance Matrix
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Platform operational security permissions matrix and HIPAA compliance audit trail logs
        </p>
      </div>

      {/* RBAC Table Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-900 flex items-center justify-between">
          <span>Role Permissions Matrix</span>
          <span className="text-[11px] text-teal-700 font-normal">HealthForecast AI Policy Spec v2.1</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Platform Feature</th>
                <th className="py-3 px-4 text-teal-800">Doctor</th>
                <th className="py-3 px-4 text-indigo-800">Hospital Admin</th>
                <th className="py-3 px-4 text-amber-800">Healthcare Researcher</th>
                <th className="py-3 px-4 text-emerald-800">System Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accessMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-800">{row.feature}</td>
                  <td className="py-3 px-4 text-slate-700">{row.doctor}</td>
                  <td className="py-3 px-4 text-slate-700">{row.admin}</td>
                  <td className="py-3 px-4 text-slate-700">{row.researcher}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">{row.sysadmin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-900">
          System Security & Activity Audit Log
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">User Email & Role</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Target Patient</th>
                <th className="py-3 px-4">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 block">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 uppercase">{log.userRole}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-teal-700">{log.action}</td>
                  <td className="py-3 px-4 text-slate-600">{log.targetPatientId || '—'}</td>
                  <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
