// HealthForecast AI — TypeScript API types matching backend Pydantic schemas

export type UserRole = 'doctor' | 'hospital_administrator' | 'healthcare_researcher' | 'system_administrator';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  hospital_name: string | null;
  department: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  hospital_name?: string;
  department?: string;
  phone?: string;
}

export interface Patient {
  id: string;
  patient_name: string;
  gender: string;
  age: number;
  race: string | null;
  admission_type: string | null;
  discharge_disposition: string | null;
  admission_source: string | null;
  time_in_hospital: number;
  num_lab_procedures: number;
  num_procedures: number;
  num_medications: number;
  number_outpatient: number;
  number_emergency: number;
  number_inpatient: number;
  diagnosis_1: string | null;
  diagnosis_2: string | null;
  diagnosis_3: string | null;
  diabetes_med: string | null;
  insulin: string | null;
  a1c_result: string | null;
  glucose_result: string | null;
  attending_doctor: string | null;
  created_at: string;
}

export interface PatientListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Patient[];
}

export interface PatientFilters {
  search?: string;
  gender?: string;
  min_age?: number;
  max_age?: number;
  admission_type?: string;
  attending_doctor?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export type RiskCategory = 'low' | 'moderate' | 'high' | 'critical';

export interface PredictionRequest {
  patient_id?: string;
  gender?: string;
  age?: number;
  race?: string;
  admission_type?: string;
  discharge_disposition?: string;
  admission_source?: string;
  time_in_hospital?: number;
  num_lab_procedures?: number;
  num_procedures?: number;
  num_medications?: number;
  number_outpatient?: number;
  number_emergency?: number;
  number_inpatient?: number;
  diagnosis_1?: string;
  diagnosis_2?: string;
  diagnosis_3?: string;
  diabetes_med?: string;
  insulin?: string;
  a1c_result?: string;
  glucose_result?: string;
}

export interface Prediction {
  id: string;
  patient_id: string;
  probability: number;
  risk_category: RiskCategory;
  confidence: number;
  recommendation: string;
  model_version: string;
  created_at: string;
}

export interface PredictionListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Prediction[];
}

export interface DashboardSummary {
  total_patients: number;
  total_predictions: number;
  high_risk_patients: number;
  average_risk_score: number;
  readmission_rate: number;
  recovery_rate: number;
}

export interface RecentPrediction {
  patient_id: string;
  patient_name: string;
  risk_category: RiskCategory;
  probability: number;
  created_at: string;
}

export interface ReadmissionStats {
  total: number;
  readmitted: number;
  not_readmitted: number;
  readmission_rate: number;
}

export interface HospitalOverview {
  hospital_name: string | null;
  total_patients: number;
  total_doctors: number;
  high_risk_patients: number;
}

export interface AgeDistributionPoint {
  age_group: string;
  count: number;
}

export interface MonthlyAnalyticsPoint {
  month: string;
  total_predictions: number;
  high_risk_count: number;
  average_probability: number;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export type ReportType = 'pdf' | 'csv' | 'excel';

export interface ReportGenerateRequest {
  report_type: ReportType;
  title?: string;
  patient_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface Report {
  id: string;
  report_type: string;
  title: string | null;
  status: string;
  download_url: string | null;
  created_by: string;
  created_at: string;
}

export interface ReportListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Report[];
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  details?: unknown;
}
