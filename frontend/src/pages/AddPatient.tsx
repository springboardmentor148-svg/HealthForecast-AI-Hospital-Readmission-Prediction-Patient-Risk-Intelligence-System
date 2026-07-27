import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { patientsApi } from '../api/patients';
import { useToast } from '../components/Toast';

const GENDERS = ['male', 'female', 'other'];
const RACES = ['Caucasian', 'African American', 'Hispanic', 'Asian', 'Other'];
const ADMISSION_TYPES = ['Emergency', 'Urgent', 'Elective', 'Newborn', 'Not Available'];
const DISCHARGE_DISPOSITIONS = ['Home', 'Transferred', 'Expired', 'Left AMA', 'Other'];
const ADMISSION_SOURCES = ['Referral', 'Emergency Room', 'Transfer', 'Other'];
const DIABETES_MED_OPTS = ['Yes', 'No'];
const INSULIN_OPTS = ['No', 'Down', 'Steady', 'Up'];
const A1C_OPTS = ['None', 'Norm', '>7', '>8'];
const GLUCOSE_OPTS = ['None', 'Norm', '>200', '>300'];

const SectionTitle: React.FC<{ n: number; title: string; sub: string }> = ({ n, title, sub }) => (
  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{n}</div>
    <div><div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div><div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{sub}</div></div>
  </div>
);

const AddPatient: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [form, setForm] = useState({
    patient_name: '', gender: 'male', age: '', race: '',
    admission_type: '', discharge_disposition: '', admission_source: '', time_in_hospital: '0', attending_doctor: '',
    num_lab_procedures: '0', num_procedures: '0', num_medications: '0', number_outpatient: '0', number_emergency: '0', number_inpatient: '0',
    diagnosis_1: '', diagnosis_2: '', diagnosis_3: '',
    diabetes_med: '', insulin: '', a1c_result: '', glucose_result: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.patient_name.trim()) e.patient_name = 'Patient name is required';
    if (!form.age || isNaN(+form.age) || +form.age < 0 || +form.age > 130) e.age = 'Valid age (0–130) required';
    return e;
  };

  const mutation = useMutation({
    mutationFn: () => patientsApi.create({
      patient_name: form.patient_name,
      gender: form.gender,
      age: +form.age,
      race: form.race || null,
      admission_type: form.admission_type || null,
      discharge_disposition: form.discharge_disposition || null,
      admission_source: form.admission_source || null,
      time_in_hospital: +form.time_in_hospital,
      attending_doctor: form.attending_doctor || null,
      num_lab_procedures: +form.num_lab_procedures,
      num_procedures: +form.num_procedures,
      num_medications: +form.num_medications,
      number_outpatient: +form.number_outpatient,
      number_emergency: +form.number_emergency,
      number_inpatient: +form.number_inpatient,
      diagnosis_1: form.diagnosis_1 || null,
      diagnosis_2: form.diagnosis_2 || null,
      diagnosis_3: form.diagnosis_3 || null,
      diabetes_med: form.diabetes_med || null,
      insulin: form.insulin || null,
      a1c_result: form.a1c_result || null,
      glucose_result: form.glucose_result || null,
    } as any),
    onSuccess: (patient) => {
      success('Patient added successfully!');
      navigate(`/patients/${patient.id}`);
    },
    onError: (e: any) => showError(e?.response?.data?.message ?? 'Failed to add patient'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setErrors({});
    mutation.mutate();
  };

  const field = (label: string, key: string, type = 'text', required = false, min?: number, max?: number) => (
    <div className="form-group">
      <label className="form-label">{label}{required && <span className="form-required"> *</span>}</label>
      <input className="form-input" type={type} min={min} max={max} value={(form as any)[key]} onChange={(e) => set(key, e.target.value)} />
      {errors[key] && <div className="form-error">{errors[key]}</div>}
    </div>
  );

  const selectField = (label: string, key: string, opts: string[]) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-input form-select" value={(form as any)[key]} onChange={(e) => set(key, e.target.value)}>
        <option value="">Select...</option>
        {opts.map((o) => <option key={o} value={o.toLowerCase()}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <div className="breadcrumb"><span>Patients</span><span className="breadcrumb-sep">/</span><span className="breadcrumb-current">Add New</span></div>
          <h1 className="page-title">Add New Patient</h1>
          <p className="page-subtitle">Fill in the clinical details to register a new patient</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/patients')}><ArrowLeft size={15} /> Back</button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Personal */}
        <div className="card mb-4">
          <div className="card-body">
            <SectionTitle n={1} title="Personal Information" sub="Basic demographic details" />
            <div className="grid-3">
              {field('Patient Name', 'patient_name', 'text', true)}
              {field('Age', 'age', 'number', true, 0, 130)}
              <div className="form-group">
                <label className="form-label">Gender<span className="form-required"> *</span></label>
                <select className="form-input form-select" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                  {GENDERS.map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2" style={{ marginTop: 16 }}>
              {selectField('Race / Ethnicity', 'race', RACES)}
              {field('Attending Doctor', 'attending_doctor')}
            </div>
          </div>
        </div>

        {/* Section 2: Admission */}
        <div className="card mb-4">
          <div className="card-body">
            <SectionTitle n={2} title="Hospital & Admission" sub="Admission and discharge details" />
            <div className="grid-3">
              {selectField('Admission Type', 'admission_type', ADMISSION_TYPES)}
              {selectField('Discharge Disposition', 'discharge_disposition', DISCHARGE_DISPOSITIONS)}
              {selectField('Admission Source', 'admission_source', ADMISSION_SOURCES)}
            </div>
            <div className="grid-2" style={{ marginTop: 16 }}>
              {field('Time in Hospital (days)', 'time_in_hospital', 'number', false, 0)}
            </div>
          </div>
        </div>

        {/* Section 3: Procedures */}
        <div className="card mb-4">
          <div className="card-body">
            <SectionTitle n={3} title="Medical Procedures & Visits" sub="Procedure counts and visit history" />
            <div className="grid-3">
              {field('Lab Procedures', 'num_lab_procedures', 'number', false, 0)}
              {field('Procedures', 'num_procedures', 'number', false, 0)}
              {field('Medications', 'num_medications', 'number', false, 0)}
              {field('Outpatient Visits', 'number_outpatient', 'number', false, 0)}
              {field('Emergency Visits', 'number_emergency', 'number', false, 0)}
              {field('Inpatient Visits', 'number_inpatient', 'number', false, 0)}
            </div>
          </div>
        </div>

        {/* Section 4: Diagnoses & Labs */}
        <div className="card mb-4">
          <div className="card-body">
            <SectionTitle n={4} title="Diagnoses & Lab Results" sub="ICD codes and clinical lab values" />
            <div className="grid-3" style={{ marginBottom: 16 }}>
              {field('Primary Diagnosis (ICD)', 'diagnosis_1')}
              {field('Secondary Diagnosis', 'diagnosis_2')}
              {field('Tertiary Diagnosis', 'diagnosis_3')}
            </div>
            <div className="grid-4">
              {selectField('Diabetes Medication', 'diabetes_med', DIABETES_MED_OPTS)}
              {selectField('Insulin', 'insulin', INSULIN_OPTS)}
              {selectField('A1C Result', 'a1c_result', A1C_OPTS)}
              {selectField('Glucose Serum', 'glucose_result', GLUCOSE_OPTS)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setForm({ patient_name:'',gender:'male',age:'',race:'',admission_type:'',discharge_disposition:'',admission_source:'',time_in_hospital:'0',attending_doctor:'',num_lab_procedures:'0',num_procedures:'0',num_medications:'0',number_outpatient:'0',number_emergency:'0',number_inpatient:'0',diagnosis_1:'',diagnosis_2:'',diagnosis_3:'',diabetes_med:'',insulin:'',a1c_result:'',glucose_result:'' })}>Reset</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={mutation.isPending}>
            {mutation.isPending ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</> : <><Save size={16} /> Save Patient</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPatient;
