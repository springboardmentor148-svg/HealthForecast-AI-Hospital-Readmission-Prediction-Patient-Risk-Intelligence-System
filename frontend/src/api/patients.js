import { apiRequest } from './client';
import { getUserInitials } from '../utils/auth';

function toNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatEnumLabel(value) {
  if (!value) return '';
  return String(value)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeMedications(medications) {
  if (Array.isArray(medications)) return medications;
  if (typeof medications === 'string') {
    return medications.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function mapPatientToUi(patient) {
  if (!patient) return null;

  const displayName = patient.full_name || [patient.first_name, patient.last_name].filter(Boolean).join(' ');
  const admissionType = formatEnumLabel(patient.admission_type);
  const gender = formatEnumLabel(patient.gender);

  return {
    ...patient,
    id: String(patient.id),
    patientIdentifier: patient.patient_identifier,
    name: displayName,
    fullName: displayName,
    avatarInitials: getUserInitials(displayName),
    age: patient.age_at_admission ?? '',
    gender,
    admissionType,
    primaryDiagnosis: patient.primary_diagnosis || '',
    secondaryDiagnosis: patient.secondary_diagnosis || '',
    lastAdmissionDate: patient.discharge_date || patient.admission_date || '',
    assignedDoctor: patient.assigned_doctor_name || '',
    priorDiagnosesCount: patient.prior_diagnoses_count ?? 0,
    medications: normalizeMedications(patient.medications),
    labProceduresCount: patient.lab_procedures_count ?? 0,
    timeInHospital: patient.time_in_hospital ?? 0,
    followUpSchedule: patient.follow_up_schedule || '',
    dischargePlan: patient.discharge_plan || '',
    riskBand: patient.risk_band || 'low',
    readmissionProbability: Number(patient.readmission_probability ?? 0),
    predictionHistory: Array.isArray(patient.prediction_history)
      ? patient.prediction_history.map((history) => ({
          id: history.id,
          date: history.date,
          model: history.model,
          prob: Number(history.prob ?? 0),
          riskBand: history.risk_band || 'low',
        }))
      : [],
  };
}

function normalizePatientList(payload) {
  return (payload?.patients || []).map(mapPatientToUi);
}

function normalizePatient(payload) {
  return mapPatientToUi(payload?.patient || payload);
}

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function buildPatientPayload(formState) {
  return {
    patient_identifier: formState.patientIdentifier,
    full_name: formState.fullName,
    age_at_admission: toNumber(formState.ageAtAdmission),
    gender: formState.gender,
    admission_type: formState.admissionType,
    primary_diagnosis: formState.primaryDiagnosis,
    secondary_diagnosis: formState.secondaryDiagnosis,
    admission_date: formState.admissionDate || null,
    discharge_date: formState.dischargeDate || null,
    time_in_hospital: toNumber(formState.timeInHospital),
    prior_diagnoses_count: toNumber(formState.priorDiagnosesCount),
    lab_procedures_count: toNumber(formState.labProceduresCount),
    medications: normalizeMedications(formState.medications),
    follow_up_schedule: formState.followUpSchedule,
    discharge_plan: formState.dischargePlan,
    risk_band: formState.riskBand,
    readmission_probability: toNumber(formState.readmissionProbability),
    assigned_doctor_id: toNumber(formState.assignedDoctorId),
    is_active: formState.isActive,
  };
}

export async function listPatients(params = {}) {
  const response = await apiRequest(`/patients${buildQueryString(params)}`);
  return normalizePatientList(response);
}

export async function getPatient(patientId) {
  const response = await apiRequest(`/patients/${patientId}`);
  return normalizePatient(response);
}

export async function createPatient(payload) {
  const response = await apiRequest('/patients', {
    method: 'POST',
    body: payload,
  });
  return normalizePatient(response);
}

export async function updatePatient(patientId, payload) {
  const response = await apiRequest(`/patients/${patientId}`, {
    method: 'PUT',
    body: payload,
  });
  return normalizePatient(response);
}

export async function deletePatient(patientId) {
  await apiRequest(`/patients/${patientId}`, {
    method: 'DELETE',
  });
}

export async function validateImportPatients(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/patients/import/validate', {
    method: 'POST',
    body: formData,
  });
}

export async function importPatients(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/patients/import', {
    method: 'POST',
    body: formData,
  });
}
