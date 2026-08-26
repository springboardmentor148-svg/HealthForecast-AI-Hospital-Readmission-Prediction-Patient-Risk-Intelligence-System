import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import { buildPatientPayload } from '../api/patients';

const genderOptions = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
];

const admissionOptions = [
  { value: 'emergency', label: 'Emergency' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'elective', label: 'Elective' },
  { value: 'newborn', label: 'Newborn' },
  { value: 'trauma', label: 'Trauma' },
  { value: 'other', label: 'Other' },
];

const riskOptions = [
  { value: '', label: 'Not set' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

function getInitialState(patient) {
  if (!patient) {
    return {
      patientIdentifier: '',
      fullName: '',
      ageAtAdmission: '',
      gender: 'unknown',
      admissionType: 'other',
      primaryDiagnosis: '',
      secondaryDiagnosis: '',
      admissionDate: '',
      dischargeDate: '',
      timeInHospital: '',
      priorDiagnosesCount: '',
      labProceduresCount: '',
      medications: '',
      followUpSchedule: '',
      dischargePlan: '',
      riskBand: '',
      readmissionProbability: '',
      assignedDoctorId: '',
      isActive: true,
    };
  }

  return {
    patientIdentifier: patient.patient_identifier || patient.patientIdentifier || '',
    fullName: patient.full_name || patient.fullName || patient.name || '',
    ageAtAdmission: patient.age_at_admission ?? patient.age ?? '',
    gender: patient.gender || 'unknown',
    admissionType: patient.admission_type || patient.admissionType || 'other',
    primaryDiagnosis: patient.primary_diagnosis || patient.primaryDiagnosis || '',
    secondaryDiagnosis: patient.secondary_diagnosis || patient.secondaryDiagnosis || '',
    admissionDate: patient.admission_date || '',
    dischargeDate: patient.discharge_date || patient.lastAdmissionDate || '',
    timeInHospital: patient.time_in_hospital ?? patient.timeInHospital ?? '',
    priorDiagnosesCount: patient.prior_diagnoses_count ?? patient.priorDiagnosesCount ?? '',
    labProceduresCount: patient.lab_procedures_count ?? patient.labProceduresCount ?? '',
    medications: Array.isArray(patient.medications) ? patient.medications.join(', ') : '',
    followUpSchedule: patient.follow_up_schedule || patient.followUpSchedule || '',
    dischargePlan: patient.discharge_plan || patient.dischargePlan || '',
    riskBand: patient.risk_band || patient.riskBand || '',
    readmissionProbability: patient.readmission_probability ?? patient.readmissionProbability ?? '',
    assignedDoctorId: patient.assigned_doctor_id ?? patient.assignedDoctorId ?? '',
    isActive: patient.is_active ?? true,
  };
}

export default function PatientFormModal({
  isOpen,
  mode,
  patient,
  onClose,
  onSubmit,
  submitLabel,
}) {
  const [formState, setFormState] = useState(getInitialState(patient));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormState(getInitialState(patient));
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, patient]);

  if (!isOpen) return null;

  const updateField = (field) => (event) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value;
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await onSubmit(buildPatientPayload(formState));
      onClose();
    } catch (error) {
      setErrorMessage(error?.message || `Unable to ${mode === 'edit' ? 'update' : 'create'} patient.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName = 'h-10';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-surface border border-borderColor rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-borderColor flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[16px] font-bold text-txt-primary">
              {mode === 'edit' ? 'Edit Patient' : 'Add Patient'}
            </h3>
            <p className="text-[12px] text-txt-muted mt-1">
              {mode === 'edit'
                ? 'Update the patient record using backend-supported fields.'
                : 'Create a new patient record using backend-supported fields.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-txt-muted hover:text-txt-primary rounded-xl px-3 py-2 border border-borderColor hover:bg-bg-app transition-colors"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {errorMessage && (
            <div className="rounded-xl border border-danger/15 bg-danger-bg/20 px-3.5 py-2 text-[12px] font-semibold text-danger">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="patient-identifier">
                Patient Identifier
              </label>
              <Input
                id="patient-identifier"
                value={formState.patientIdentifier}
                onChange={updateField('patientIdentifier')}
                className={inputClassName}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="full-name">
                Full Name
              </label>
              <Input
                id="full-name"
                value={formState.fullName}
                onChange={updateField('fullName')}
                className={inputClassName}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="age-at-admission">
                Age at Admission
              </label>
              <Input
                id="age-at-admission"
                type="number"
                min={0}
                value={formState.ageAtAdmission}
                onChange={updateField('ageAtAdmission')}
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="gender">
                Gender
              </label>
              <Select
                id="gender"
                options={genderOptions}
                value={formState.gender}
                onChange={updateField('gender')}
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="admission-type">
                Admission Type
              </label>
              <Select
                id="admission-type"
                options={admissionOptions}
                value={formState.admissionType}
                onChange={updateField('admissionType')}
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="risk-band">
                Risk Band
              </label>
              <Select
                id="risk-band"
                options={riskOptions}
                value={formState.riskBand}
                onChange={updateField('riskBand')}
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="primary-diagnosis">
                Primary Diagnosis
              </label>
              <Input
                id="primary-diagnosis"
                value={formState.primaryDiagnosis}
                onChange={updateField('primaryDiagnosis')}
                className={inputClassName}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="secondary-diagnosis">
                Secondary Diagnosis
              </label>
              <Input
                id="secondary-diagnosis"
                value={formState.secondaryDiagnosis}
                onChange={updateField('secondaryDiagnosis')}
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="admission-date">
                Admission Date
              </label>
              <Input
                id="admission-date"
                type="date"
                value={formState.admissionDate}
                onChange={updateField('admissionDate')}
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="discharge-date">
                Discharge Date
              </label>
              <Input
                id="discharge-date"
                type="date"
                value={formState.dischargeDate}
                onChange={updateField('dischargeDate')}
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="time-in-hospital">
                Time in Hospital
              </label>
              <Input
                id="time-in-hospital"
                type="number"
                min={0}
                value={formState.timeInHospital}
                onChange={updateField('timeInHospital')}
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="prior-diagnoses-count">
                Prior Diagnoses Count
              </label>
              <Input
                id="prior-diagnoses-count"
                type="number"
                min={0}
                value={formState.priorDiagnosesCount}
                onChange={updateField('priorDiagnosesCount')}
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="lab-procedures-count">
                Lab Procedures Count
              </label>
              <Input
                id="lab-procedures-count"
                type="number"
                min={0}
                value={formState.labProceduresCount}
                onChange={updateField('labProceduresCount')}
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="readmission-probability">
                Readmission Probability
              </label>
              <Input
                id="readmission-probability"
                type="number"
                min={0}
                max={100}
                value={formState.readmissionProbability}
                onChange={updateField('readmissionProbability')}
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="assigned-doctor-id">
                Assigned Doctor ID
              </label>
              <Input
                id="assigned-doctor-id"
                type="number"
                min={0}
                value={formState.assignedDoctorId}
                onChange={updateField('assignedDoctorId')}
                className={inputClassName}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="medications">
                Medications
              </label>
              <Input
                id="medications"
                value={formState.medications}
                onChange={updateField('medications')}
                className={inputClassName}
                placeholder="Comma-separated medication names"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="follow-up-schedule">
                Follow-Up Schedule
              </label>
              <textarea
                id="follow-up-schedule"
                value={formState.followUpSchedule}
                onChange={updateField('followUpSchedule')}
                className="w-full min-h-24 px-3.5 py-3 bg-surface border border-borderColor rounded-xl text-[14px] text-txt-primary font-normal focus:outline-none focus:border-info focus:ring-1 focus:ring-info transition-all placeholder:text-txt-muted/70 disabled:bg-bg-app disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[12px] font-bold text-txt-muted block pl-1" htmlFor="discharge-plan">
                Discharge Plan
              </label>
              <textarea
                id="discharge-plan"
                value={formState.dischargePlan}
                onChange={updateField('dischargePlan')}
                className="w-full min-h-24 px-3.5 py-3 bg-surface border border-borderColor rounded-xl text-[14px] text-txt-primary font-normal focus:outline-none focus:border-info focus:ring-1 focus:ring-info transition-all placeholder:text-txt-muted/70 disabled:bg-bg-app disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="is-active"
                type="checkbox"
                checked={formState.isActive}
                onChange={updateField('isActive')}
                className="w-4 h-4 accent-info bg-surface border-borderColor rounded cursor-pointer"
              />
              <label className="text-[12px] font-semibold text-txt-muted select-none cursor-pointer" htmlFor="is-active">
                Active patient record
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-borderColor">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : submitLabel || (mode === 'edit' ? 'Save Changes' : 'Create Patient')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

PatientFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  patient: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string,
};
