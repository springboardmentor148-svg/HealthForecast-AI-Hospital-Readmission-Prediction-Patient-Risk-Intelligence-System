import React, { useState } from 'react';
import { PatientRecord, RiskTier, UserRole } from '../types';
import {
  Search,
  Filter,
  Activity,
  AlertTriangle,
  CheckCircle,
  FileText,
  Sparkles,
  UserPlus,
  ArrowUpDown,
  Flame,
} from 'lucide-react';

interface PatientManagementProps {
  patients: PatientRecord[];
  userRole: UserRole;
  onSelectPatient: (patient: PatientRecord) => void;
  onOpenNewPatient: () => void;
  onOpenGeminiAssistant: (patient: PatientRecord, mode: 'care_plan' | 'discharge_readiness') => void;
  selectedRiskTier: string;
  setSelectedRiskTier: (tier: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
}

export const PatientManagement: React.FC<PatientManagementProps> = ({
  patients,
  userRole,
  onSelectPatient,
  onOpenNewPatient,
  onOpenGeminiAssistant,
  selectedRiskTier,
  setSelectedRiskTier,
  selectedDepartment,
  setSelectedDepartment,
}) => {
  const [sortField, setSortField] = useState<'riskScore' | 'timeInHospital' | 'numMedications'>('riskScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredPatients = patients
    .filter((p) => {
      if (selectedRiskTier !== 'All' && p.riskTier !== selectedRiskTier) return false;
      if (selectedDepartment !== 'All' && p.department !== selectedDepartment) return false;
      return true;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (sortOrder === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

  const getRiskBadge = (tier: RiskTier, score: number) => {
    switch (tier) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-900/50">
            <Flame className="w-3 h-3 text-rose-500" /> Critical ({score}%)
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-900/50">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> High ({score}%)
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-200 dark:border-blue-900/50">
            <Activity className="w-3 h-3 text-blue-500" /> Medium ({score}%)
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle className="w-3 h-3 text-emerald-500" /> Low ({score}%)
          </span>
        );
    }
  };

  const handleSort = (field: 'riskScore' | 'timeInHospital' | 'numMedications') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Quick Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Patient Record Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Diabetes 130-US Hospitals clinical roster with automated machine learning risk stratification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewPatient}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            New Patient Intake
          </button>
        </div>
      </div>

      {/* Filter and View Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs">
        
        {/* Risk Tier Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-slate-500 font-medium mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Risk:
          </span>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedRiskTier(tier)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedRiskTier === tier
                  ? 'bg-slate-900 text-white font-semibold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        {/* Department Filter & Layout Switcher */}
        <div className="flex items-center gap-3">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            <option value="All">All Departments</option>
            <option value="Endocrinology">Endocrinology</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Internal Medicine">Internal Medicine</option>
            <option value="Emergency">Emergency</option>
            <option value="General Surgery">General Surgery</option>
          </select>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Patient List Container */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Patient / MRN</th>
                  <th className="py-3.5 px-4">Demographics</th>
                  <th className="py-3.5 px-4">Primary Diagnosis</th>
                  <th className="py-3.5 px-4">HbA1c & Glucose</th>
                  <th className="py-3.5 px-4">
                    <button
                      onClick={() => handleSort('timeInHospital')}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Stay & Meds <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4">
                    <button
                      onClick={() => handleSort('riskScore')}
                      className="flex items-center gap-1 hover:text-slate-900 font-bold text-teal-700"
                    >
                      Readmission Risk <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-teal-50/30 transition-colors cursor-pointer group"
                    onClick={() => onSelectPatient(patient)}
                  >
                    {/* Patient Name / MRN */}
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 group-hover:text-teal-700">
                          {userRole === 'researcher' ? `Anonymized ${patient.id}` : patient.name}
                        </span>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {patient.id} • {patient.medicalRecordNumber}
                        </div>
                      </div>
                    </td>

                    {/* Demographics */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{patient.age} • {patient.gender}</div>
                      <div className="text-[11px] text-slate-400">{patient.race}</div>
                    </td>

                    {/* Primary Diagnosis */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 truncate" title={patient.primaryDiagnosis}>
                        {patient.primaryDiagnosis}
                      </div>
                      <div className="text-[11px] text-slate-400">Dept: {patient.department}</div>
                    </td>

                    {/* Lab indicators */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          patient.a1cResult === '>8' ? 'bg-rose-100 text-rose-700' :
                          patient.a1cResult === '>7' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          A1c: {patient.a1cResult}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          patient.glucoseTest === '>300' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          Glucose: {patient.glucoseTest}
                        </span>
                      </div>
                    </td>

                    {/* Hospital Stay & Meds */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div><span className="font-semibold">{patient.timeInHospital}</span> days in hosp</div>
                      <div className="text-[11px] text-slate-400">{patient.numMedications} rx meds • {patient.numInpatientVisits} prior stays</div>
                    </td>

                    {/* Risk Tier & Score */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {getRiskBadge(patient.riskTier, patient.riskScore)}
                        <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              patient.riskScore >= 80 ? 'bg-rose-500' :
                              patient.riskScore >= 65 ? 'bg-amber-500' :
                              patient.riskScore >= 45 ? 'bg-blue-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${patient.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectPatient(patient)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition-all"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onOpenGeminiAssistant(patient, 'care_plan')}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                          title="Generate AI Care Plan with Gemini"
                        >
                          <Sparkles className="w-3 h-3 text-teal-600" />
                          AI Care Plan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => onSelectPatient(patient)}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {userRole === 'researcher' ? `Anonymized ${patient.id}` : patient.name}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">{patient.id} • {patient.medicalRecordNumber}</p>
                  </div>
                  {getRiskBadge(patient.riskTier, patient.riskScore)}
                </div>

                <p className="text-xs text-slate-700 font-medium mb-2 line-clamp-2">
                  {patient.primaryDiagnosis}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                  <div>
                    <span className="text-slate-400 block">Stay Duration:</span>
                    <span className="font-semibold text-slate-800">{patient.timeInHospital} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Meds:</span>
                    <span className="font-semibold text-slate-800">{patient.numMedications} Prescriptions</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">HbA1c Level:</span>
                    <span className="font-semibold text-slate-800">{patient.a1cResult}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Prior Admissions:</span>
                    <span className="font-semibold text-slate-800">{patient.numInpatientVisits} Hospital</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400 text-[11px]">Dept: {patient.department}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenGeminiAssistant(patient, 'care_plan');
                  }}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                >
                  <Sparkles className="w-3 h-3" /> AI Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
