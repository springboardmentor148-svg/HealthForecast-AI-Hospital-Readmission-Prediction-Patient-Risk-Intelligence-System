import React from 'react';
import { PatientRecord } from '../types';
import {
  X,
  Sparkles,
  Activity,
  AlertTriangle,
  Pill,
  Clock,
  Building,
  CheckCircle2,
  FileCheck2,
  Stethoscope,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';

interface PatientDetailModalProps {
  patient: PatientRecord | null;
  onClose: () => void;
  onOpenGeminiAssistant: (patient: PatientRecord, mode: 'care_plan' | 'discharge_readiness') => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  onClose,
  onOpenGeminiAssistant,
}) => {
  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl my-8">
        
        {/* Top Header */}
        <div className="sticky top-0 bg-slate-900 text-white p-6 rounded-t-2xl flex items-start justify-between border-b border-slate-800 z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">{patient.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 border border-slate-700 text-slate-300">
                {patient.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 border border-slate-700 text-teal-300">
                {patient.medicalRecordNumber}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {patient.age} • {patient.gender} • {patient.race} | Assigned to {patient.assignedDoctor} ({patient.department})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          
          {/* Risk Overview Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider block">30-Day Readmission Risk</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${
                  patient.riskScore >= 75 ? 'text-rose-600' :
                  patient.riskScore >= 50 ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {patient.riskScore}%
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                  {patient.riskTier} Tier
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Likelihood: {patient.readmissionLikelihood}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider block">Discharge Readiness</span>
              <div className="text-2xl font-bold text-slate-800">
                {patient.dischargeReadinessScore}%
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-600 h-1.5 rounded-full"
                  style={{ width: `${patient.dischargeReadinessScore}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider block">Length of Stay</span>
              <div className="text-2xl font-bold text-slate-800">
                {patient.timeInHospital} Days
              </div>
              <p className="text-[11px] text-slate-500">Admitted: {patient.admissionDate}</p>
            </div>

            <div className="space-y-1 flex flex-col justify-center">
              <button
                onClick={() => onOpenGeminiAssistant(patient, 'care_plan')}
                className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Sparkles className="w-4 h-4 text-teal-200" />
                Gemini AI Care Plan
              </button>
            </div>
          </div>

          {/* Primary & Secondary Diagnoses */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-teal-600" /> Clinical Diagnoses (ICD-9)
            </h3>
            <div className="space-y-1 text-slate-800">
              <p className="font-semibold text-teal-800">Primary: {patient.primaryDiagnosis}</p>
              {patient.secondaryDiagnosis1 && (
                <p className="text-slate-600">Secondary 1: {patient.secondaryDiagnosis1}</p>
              )}
              {patient.secondaryDiagnosis2 && (
                <p className="text-slate-600">Secondary 2: {patient.secondaryDiagnosis2}</p>
              )}
            </div>
          </div>

          {/* Encounter Utilization & Lab Tests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Encounter Utilization Metrics */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" /> Encounter & Utilization Stats
              </h3>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Admission Type:</span>
                  <span className="font-semibold text-slate-800">{patient.admissionType}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Discharge To:</span>
                  <span className="font-semibold text-slate-800">{patient.dischargeDisposition}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Lab Procedures:</span>
                  <span className="font-semibold text-slate-800">{patient.numLabProcedures}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Prescription Meds:</span>
                  <span className="font-semibold text-slate-800">{patient.numMedications}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Prior Inpatient Stays:</span>
                  <span className="font-semibold text-slate-800">{patient.numInpatientVisits}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Prior ER Visits:</span>
                  <span className="font-semibold text-slate-800">{patient.numEmergencyVisits}</span>
                </div>
              </div>
            </div>

            {/* Diabetes Regimen & Labs */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-emerald-600" /> Diabetes Regimen & Labs
              </h3>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">HbA1c Test Result:</span>
                  <span className="font-bold text-slate-900">{patient.a1cResult}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Glucose Test Result:</span>
                  <span className="font-bold text-slate-900">{patient.glucoseTest}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Insulin Titration:</span>
                  <span className={`font-bold ${patient.medications.insulin === 'Up' ? 'text-rose-600' : 'text-slate-900'}`}>
                    {patient.medications.insulin}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Metformin Status:</span>
                  <span className="font-bold text-slate-900">{patient.medications.metformin}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-600 font-medium">Overall Med Change:</span>
                  <span className="font-bold text-teal-700">{patient.medications.changeInDiabetesMed === 'Ch' ? 'Changed' : 'No Change'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Machine Learning SHAP Risk Waterfall Breakdown */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-rose-600" /> AI Feature Impact SHAP Breakdown
              </span>
              <span className="text-[11px] font-mono text-slate-400">XGBoost Feature Attribution</span>
            </h3>

            <div className="space-y-2">
              {patient.riskFactors.map((factor, idx) => {
                const isPositive = factor.impactPercent > 0;
                return (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">{factor.factor}</span>
                      <span className="text-[11px] text-slate-500">{factor.description}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`font-mono font-bold text-xs ${isPositive ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isPositive ? `+${factor.impactPercent}%` : `${factor.impactPercent}%`}
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase">
                        {factor.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Care Recommendations */}
          <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200/80 space-y-3">
            <h3 className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" /> Evidence-Based Clinical Recommendations
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {patient.careRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-4 rounded-b-2xl flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenGeminiAssistant(patient, 'discharge_readiness')}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs border border-indigo-200 transition-colors"
            >
              Check Discharge Readiness
            </button>
            <button
              onClick={() => onOpenGeminiAssistant(patient, 'care_plan')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Generate Gemini Care Plan
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
