import React, { useState } from 'react';
import { PatientRecord } from '../types';
import { Database, Download, Filter, Search, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface ResearcherDatasetExplorerProps {
  patients: PatientRecord[];
}

export const ResearcherDatasetExplorer: React.FC<ResearcherDatasetExplorerProps> = ({ patients }) => {
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [selectedAge, setSelectedAge] = useState<string>('All');

  const handleDownloadDataset = () => {
    setDownloadNotice('Generating CSV export of the current patient cohort...');
    setTimeout(() => {
      const headers = 'patient_id,age,gender,race,time_in_hospital,num_lab_procedures,num_medications,a1c_result,insulin_change,readmission_30d\n';
      const rows = patients
        .map(
          (p) =>
            `${p.id},${p.age},${p.gender},${p.race},${p.timeInHospital},${p.numLabProcedures},${p.numMedications},${p.a1cResult},${p.medications.insulin},${p.riskScore >= 65 ? '1' : '0'}`
        )
        .join('\n');

      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Patient_Cohort_Export.csv';
      a.click();

      setDownloadNotice('CSV Dataset downloaded successfully!');
      setTimeout(() => setDownloadNotice(null), 3000);
    }, 1000);
  };

  const filtered = patients.filter((p) => {
    if (selectedAge !== 'All' && p.age !== selectedAge) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-amber-600" />
              Patient Cohort Research Explorer
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse the current in-platform patient cohort for population health research and observational study
          </p>
        </div>

        <button
          onClick={handleDownloadDataset}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Export Anonymized CSV Dataset
        </button>
      </div>

      {downloadNotice && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600" />
          {downloadNotice}
        </div>
      )}

      {/* Anonymized Cohort Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Patient Encounters (N={filtered.length})
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Filter Age:</span>
            <select
              value={selectedAge}
              onChange={(e) => setSelectedAge(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
            >
              <option value="All">All Ages</option>
              <option value="[40-50)">[40-50)</option>
              <option value="[50-60)">[50-60)</option>
              <option value="[60-70)">[60-70)</option>
              <option value="[70-80)">[70-80)</option>
              <option value="[80-90)">[80-90)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Anonymized Subject ID</th>
                <th className="py-3 px-4">Age / Gender / Race</th>
                <th className="py-3 px-4">ICD-9 Diagnosis Code</th>
                <th className="py-3 px-4">Inpatient Days</th>
                <th className="py-3 px-4">Lab Procedures</th>
                <th className="py-3 px-4">A1c Result</th>
                <th className="py-3 px-4">Insulin Regimen</th>
                <th className="py-3 px-4">30d Readmit Label</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((patient) => (
                <tr key={patient.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{patient.id}</td>
                  <td className="py-3 px-4 text-slate-600">{patient.age} • {patient.gender} • {patient.race}</td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-800">{patient.primaryDiagnosis}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{patient.timeInHospital} Days</td>
                  <td className="py-3 px-4 text-slate-700">{patient.numLabProcedures}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 font-semibold">
                      {patient.a1cResult}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{patient.medications.insulin}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      patient.riskScore >= 65 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {patient.riskScore >= 65 ? 'Readmitted (<30d)' : 'No Readmit'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
