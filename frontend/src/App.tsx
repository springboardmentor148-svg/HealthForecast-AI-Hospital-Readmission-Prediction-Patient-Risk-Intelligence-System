import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { PatientManagement } from './components/PatientManagement';
import { PatientDetailModal } from './components/PatientDetailModal';
import { RiskPredictionSimulator } from './components/RiskPredictionSimulator';
import { ClinicalAssistantModal } from './components/ClinicalAssistantModal';
import { HospitalAnalyticsDashboard } from './components/HospitalAnalyticsDashboard';
import { TreatmentEffectivenessView } from './components/TreatmentEffectivenessView';
import { ResearcherDatasetExplorer } from './components/ResearcherDatasetExplorer';
import { ModelManagementView } from './components/ModelManagementView';
import { UserManagementRBACView } from './components/UserManagementRBACView';
import { NewPatientModal } from './components/NewPatientModal';

import { PatientRecord, UserRole, UserProfile, HospitalAnalyticsSummary, ModelPerformanceMetrics, TreatmentOutcomeMetric, AuditLogEntry } from './types';
import { DEMO_USERS } from './mockData';

const EMPTY_ANALYTICS: HospitalAnalyticsSummary = {
  totalPatients: 0,
  highRiskPatientsCount: 0,
  readmissionRate30Day: 0,
  avgLengthOfStayDays: 0,
  readmissionsByDepartment: [],
  readmissionsByAge: [],
  riskDistribution: [],
};

const EMPTY_MODEL_METRICS: ModelPerformanceMetrics = {
  modelName: '',
  modelVersion: '',
  algorithm: 'XGBoost Classifier',
  accuracy: 0,
  precision: 0,
  recall: 0,
  f1Score: 0,
  rocAuc: 0,
  trainedEncounters: 0,
  featureCount: 0,
  lastTrained: '',
  featureImportances: [],
  confusionMatrix: { truePositive: 0, falsePositive: 0, trueNegative: 0, falseNegative: 0 },
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS[0]); // Default: Doctor
  const [activeTab, setActiveTab] = useState<NavTab>('patients');
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [analytics, setAnalytics] = useState<HospitalAnalyticsSummary>(EMPTY_ANALYTICS);
  const [treatmentOutcomes, setTreatmentOutcomes] = useState<TreatmentOutcomeMetric[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelPerformanceMetrics>(EMPTY_MODEL_METRICS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskTier, setSelectedRiskTier] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  // Modals
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [geminiAssistantState, setGeminiAssistantState] = useState<{
    isOpen: boolean;
    patient: PatientRecord | null;
    mode: 'care_plan' | 'discharge_readiness' | 'custom';
  }>({
    isOpen: false,
    patient: null,
    mode: 'care_plan',
  });

  // Load initial server data
  useEffect(() => {
    fetchPatients();
    fetchAnalytics();
    fetchModelMetrics();
    fetchAuditLogs();
  }, []);

  // Sync default tab when user switches role
  const handleRoleChange = (newRole: UserRole) => {
    const user = DEMO_USERS.find((u) => u.role === newRole) || DEMO_USERS[0];
    setCurrentUser(user);

    if (newRole === 'doctor') setActiveTab('patients');
    else if (newRole === 'hospital_admin') setActiveTab('analytics');
    else if (newRole === 'researcher') setActiveTab('researcher');
    else if (newRole === 'sysadmin') setActiveTab('model_ops');
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients');
      if (res.ok) {
        const data = await res.json();
        if (data.patients) setPatients(data.patients);
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data = await res.json();
        if (data.analytics) setAnalytics(data.analytics);
        if (data.treatmentOutcomes) setTreatmentOutcomes(data.treatmentOutcomes);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const fetchModelMetrics = async () => {
    try {
      const res = await fetch('/api/model-metrics');
      if (res.ok) {
        const data = await res.json();
        if (data.model) setModelMetrics(data.model);
      }
    } catch (err) {
      console.error('Error fetching model metrics:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const handlePatientCreated = (newPatient: PatientRecord) => {
    setPatients((prev) => [newPatient, ...prev]);
    fetchAuditLogs();
  };

  const handleOpenGeminiAssistant = (patient: PatientRecord, mode: 'care_plan' | 'discharge_readiness' = 'care_plan') => {
    setGeminiAssistantState({
      isOpen: true,
      patient,
      mode,
    });
  };

  const handleOpenGeminiCustom = (customPatientData: any) => {
    setGeminiAssistantState({
      isOpen: true,
      patient: customPatientData as PatientRecord,
      mode: 'care_plan',
    });
  };

  // Filter patients by global search query
  const displayedPatients = patients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.medicalRecordNumber.toLowerCase().includes(q) ||
      p.primaryDiagnosis.toLowerCase().includes(q)
    );
  });

  const highRiskCount = patients.filter((p) => p.riskTier === 'Critical' || p.riskTier === 'High').length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col antialiased selection:bg-teal-500 selection:text-white">
      
      {/* Top Header Navbar */}
      <Navbar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenNewPatient={() => setIsNewPatientModalOpen(true)}
        onOpenRiskSimulator={() => setActiveTab('risk_simulator')}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userRole={currentUser.role}
          patientCount={patients.length}
          highRiskCount={highRiskCount}
          modelVersion={modelMetrics.modelVersion}
        />

        {/* Tab View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
          {activeTab === 'patients' && (
            <PatientManagement
              patients={displayedPatients}
              userRole={currentUser.role}
              onSelectPatient={setSelectedPatient}
              onOpenNewPatient={() => setIsNewPatientModalOpen(true)}
              onOpenGeminiAssistant={handleOpenGeminiAssistant}
              selectedRiskTier={selectedRiskTier}
              setSelectedRiskTier={setSelectedRiskTier}
              selectedDepartment={selectedDepartment}
              setSelectedDepartment={setSelectedDepartment}
            />
          )}

          {activeTab === 'risk_simulator' && (
            <RiskPredictionSimulator
              onOpenGeminiAssistantWithCustomData={handleOpenGeminiCustom}
            />
          )}

          {activeTab === 'analytics' && (
            <HospitalAnalyticsDashboard
              analytics={analytics}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'treatment' && (
            <TreatmentEffectivenessView
              outcomes={treatmentOutcomes}
            />
          )}

          {activeTab === 'researcher' && (
            <ResearcherDatasetExplorer
              patients={patients}
            />
          )}

          {activeTab === 'model_ops' && (
            <ModelManagementView
              metrics={modelMetrics}
            />
          )}

          {activeTab === 'rbac' && (
            <UserManagementRBACView
              auditLogs={auditLogs}
            />
          )}
        </main>

      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onOpenGeminiAssistant={handleOpenGeminiAssistant}
        />
      )}

      {/* Gemini AI Clinical Assistant Modal */}
      {geminiAssistantState.isOpen && (
        <ClinicalAssistantModal
          patient={geminiAssistantState.patient}
          mode={geminiAssistantState.mode}
          onClose={() => setGeminiAssistantState({ isOpen: false, patient: null, mode: 'care_plan' })}
        />
      )}

      {/* New Patient Intake Modal */}
      {isNewPatientModalOpen && (
        <NewPatientModal
          onClose={() => setIsNewPatientModalOpen(false)}
          onPatientCreated={handlePatientCreated}
        />
      )}

    </div>
  );
}
