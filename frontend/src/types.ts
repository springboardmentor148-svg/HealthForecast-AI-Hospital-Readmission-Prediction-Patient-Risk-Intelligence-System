export type UserRole = 'doctor' | 'hospital_admin' | 'researcher' | 'sysadmin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department?: string;
  avatar: string;
}

export type RiskTier = 'Low' | 'Medium' | 'High' | 'Critical';
export type ReadmissionWindow = '<30 Days' | '>30 Days' | 'No Readmission';

export interface RiskFactorImpact {
  factor: string;
  impactPercent: number; // e.g. +18 or -12
  description: string;
  category: 'clinical' | 'utilization' | 'lab' | 'medication';
}

export interface MedicationStatus {
  insulin: 'No' | 'Steady' | 'Up' | 'Down';
  metformin: 'No' | 'Steady' | 'Up' | 'Down';
  glipizide: 'No' | 'Steady' | 'Up' | 'Down';
  glyburide: 'No' | 'Steady' | 'Up' | 'Down';
  changeInDiabetesMed: 'No' | 'Ch';
  diabetesMedPrescribed: 'Yes' | 'No';
}

export interface PatientRecord {
  id: string;
  medicalRecordNumber: string; // MRN
  name: string;
  age: string; // e.g., '[60-70)'
  gender: 'Male' | 'Female';
  race: string;
  admissionType: 'Emergency' | 'Urgent' | 'Elective';
  dischargeDisposition: string; // e.g. 'Discharged to Home', 'SNF Care'
  admissionSource: string;
  timeInHospital: number; // Days (1-14)
  numLabProcedures: number;
  numProcedures: number;
  numMedications: number;
  numOutpatientVisits: number;
  numInpatientVisits: number;
  numEmergencyVisits: number;
  primaryDiagnosis: string;
  secondaryDiagnosis1?: string;
  secondaryDiagnosis2?: string;
  glucoseTest: 'None' | 'Normal' | '>200' | '>300';
  a1cResult: 'None' | 'Normal' | '>7' | '>8';
  medications: MedicationStatus;
  department: 'Endocrinology' | 'Cardiology' | 'Internal Medicine' | 'Emergency' | 'General Surgery';
  assignedDoctor: string;
  assignedDoctorId: string;
  admissionDate: string;
  dischargeDate?: string;
  
  // AI Derived Risk Fields
  riskScore: number; // 0 - 100
  riskTier: RiskTier;
  readmissionLikelihood: ReadmissionWindow;
  readmissionProbability: number; // 0.0 - 1.0
  riskFactors: RiskFactorImpact[];
  careRecommendations: string[];
  dischargeReadinessScore: number; // 0 - 100
  lastAssessmentDate: string;
}

export interface TreatmentOutcomeMetric {
  regime: string;
  patientCount: number;
  readmissionRate30Day: number; // percentage
  avgLengthOfStay: number; // days
  a1cReductionAvg: number; // %
  satisfactionScore: number; // out of 10
}

export interface ModelPerformanceMetrics {
  modelName: string;
  modelVersion: string;
  algorithm: 'XGBoost Classifier' | 'Random Forest' | 'Logistic Regression' | 'Deep Neural Net';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  trainedEncounters: number;
  lastTrained: string;
  featureImportances: { feature: string; importance: number }[];
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
  rocCurveData: { fpr: number; tpr: number }[];
}

export interface HospitalAnalyticsSummary {
  totalPatients: number;
  highRiskPatientsCount: number;
  readmissionRate30Day: number;
  readmissionRate30DayPrevious: number;
  avgLengthOfStayDays: number;
  estimatedCostSavings: number;
  readmissionsByAge: { ageGroup: string; rate: number; count: number }[];
  readmissionsByDepartment: { department: string; rate: number; patientCount: number }[];
  monthlyTrend: { month: string; readmitRate: number; totalAdmissions: number; highRiskRatio: number }[];
  riskDistribution: { tier: RiskTier; count: number; percentage: number }[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  action: string;
  targetPatientId?: string;
  details: string;
}
