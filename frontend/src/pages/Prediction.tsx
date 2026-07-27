import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Brain, AlertTriangle, CheckCircle, Activity, Zap } from 'lucide-react';
import { predictionApi } from '../api/prediction';
import { patientsApi } from '../api/patients';
import type { Prediction, RiskCategory } from '../types/api';
import { useToast } from '../components/Toast';

const RISK_COLORS: Record<RiskCategory, string> = {
  low: '#10B981', moderate: '#F59E0B', high: '#F97316', critical: '#EF4444',
};

const RISK_BG: Record<RiskCategory, string> = {
  low: 'rgba(16,185,129,0.08)', moderate: 'rgba(245,158,11,0.08)', high: 'rgba(249,115,22,0.08)', critical: 'rgba(239,68,68,0.08)',
};

const CircularRisk: React.FC<{ probability: number; risk: RiskCategory }> = ({ probability, risk }) => {
  const pct = Math.round(probability * 100);
  const r = 70, stroke = 10, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = RISK_COLORS[risk];
  return (
    <div className="risk-meter">
      <div className="progress-ring-container">
        <svg width={180} height={180} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={90} cy={90} r={r} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
          <circle cx={90} cy={90} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
        <div className="progress-ring-label">
          <span className="risk-probability" style={{ color }}>{pct}%</span>
          <span className="risk-label-text">readmission risk</span>
        </div>
      </div>
    </div>
  );
};

const LoadingAnimation: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 40 }}>
    <div style={{ position: 'relative', width: 64, height: 64 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--border-color)' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <Brain size={24} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: 'var(--color-primary)' }} />
    </div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Running AI Analysis...</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Analyzing 17 clinical features with XGBoost model</div>
    </div>
    <div style={{ display: 'flex', gap: 6 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)', animation: `bounce 1.2s infinite`, animationDelay: `${i * 0.2}s`, opacity: 0.7 }} />
      ))}
    </div>
    <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }`}</style>
  </div>
);

const Prediction: React.FC = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient_id');
  const { error: showError } = useToast();
  const [result, setResult] = useState<Prediction | null>(null);

  const { data: patient } = useQuery({
    queryKey: ['patient-for-prediction', patientId],
    queryFn: () => patientsApi.get(patientId!),
    enabled: !!patientId,
  });

  const [form, setForm] = useState({
    age: '', gender: 'male', race: '', admission_type: '', discharge_disposition: '',
    admission_source: '', time_in_hospital: '0', num_lab_procedures: '0', num_procedures: '0',
    num_medications: '0', number_outpatient: '0', number_emergency: '0', number_inpatient: '0',
    diabetes_med: '', insulin: '', a1c_result: '', glucose_result: '',
  });

  useEffect(() => {
    if (patient) {
      setForm({
        age: String(patient.age), gender: patient.gender, race: patient.race ?? '',
        admission_type: patient.admission_type ?? '', discharge_disposition: patient.discharge_disposition ?? '',
        admission_source: patient.admission_source ?? '', time_in_hospital: String(patient.time_in_hospital),
        num_lab_procedures: String(patient.num_lab_procedures), num_procedures: String(patient.num_procedures),
        num_medications: String(patient.num_medications), number_outpatient: String(patient.number_outpatient),
        number_emergency: String(patient.number_emergency), number_inpatient: String(patient.number_inpatient),
        diabetes_med: patient.diabetes_med ?? '', insulin: patient.insulin ?? '',
        a1c_result: patient.a1c_result ?? '', glucose_result: patient.glucose_result ?? '',
      });
    }
  }, [patient]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => predictionApi.predict({
      patient_id: patientId ?? undefined,
      age: form.age ? +form.age : undefined,
      gender: form.gender || undefined,
      race: form.race || undefined,
      admission_type: form.admission_type || undefined,
      discharge_disposition: form.discharge_disposition || undefined,
      admission_source: form.admission_source || undefined,
      time_in_hospital: +form.time_in_hospital,
      num_lab_procedures: +form.num_lab_procedures,
      num_procedures: +form.num_procedures,
      num_medications: +form.num_medications,
      number_outpatient: +form.number_outpatient,
      number_emergency: +form.number_emergency,
      number_inpatient: +form.number_inpatient,
      diabetes_med: form.diabetes_med || undefined,
      insulin: form.insulin || undefined,
      a1c_result: form.a1c_result || undefined,
      glucose_result: form.glucose_result || undefined,
    }),
    onSuccess: (data) => setResult(data),
    onError: (e: any) => {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        'Failed to run prediction';
      showError(msg);
    },
  });

  const fld = (label: string, key: string, type = 'number') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} value={(form as any)[key]} onChange={(e) => set(key, e.target.value)} />
    </div>
  );

  const sel = (label: string, key: string, opts: string[]) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-input form-select" value={(form as any)[key]} onChange={(e) => set(key, e.target.value)}>
        <option value="">Select...</option>
        {opts.map((o) => <option key={o} value={o.toLowerCase()}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Risk Prediction</h1>
          <p className="page-subtitle">
            {patient ? `Predicting for: ${patient.patient_name}` : 'Enter clinical data to predict hospital readmission risk'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(37,99,235,0.08)', borderRadius: 'var(--radius-full)', fontSize: 13, color: 'var(--color-primary)', fontWeight: 500 }}>
          <Zap size={14} /> XGBoost v1.0.0
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 24, transition: 'all 0.4s ease' }}>
        {/* Input Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {patient && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-active)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-md)' }}>
              <CheckCircle size={16} color="var(--color-primary)" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>Using patient record: <strong>{patient.patient_name}</strong> ({patient.age}y, {patient.gender})</span>
            </div>
          )}

          <div className="card">
            <div className="card-header"><h3 className="card-title">Clinical Input</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-3">
                {fld('Age', 'age')}
                {sel('Gender', 'gender', ['Male', 'Female', 'Other'])}
                {sel('Race', 'race', ['Caucasian', 'African American', 'Hispanic', 'Asian', 'Other'])}
              </div>
              <div className="divider" />
              <div className="grid-3">
                {sel('Admission Type', 'admission_type', ['Emergency', 'Urgent', 'Elective', 'Newborn', 'Not Available'])}
                {sel('Discharge Disposition', 'discharge_disposition', ['Home', 'Transferred', 'Expired', 'Left AMA', 'Other'])}
                {sel('Admission Source', 'admission_source', ['Referral', 'Emergency Room', 'Transfer', 'Other'])}
              </div>
              <div className="grid-3">
                {fld('Time in Hospital', 'time_in_hospital')}
                {fld('Lab Procedures', 'num_lab_procedures')}
                {fld('Medications', 'num_medications')}
                {fld('Outpatient Visits', 'number_outpatient')}
                {fld('Emergency Visits', 'number_emergency')}
                {fld('Inpatient Visits', 'number_inpatient')}
              </div>
              <div className="divider" />
              <div className="grid-4">
                {sel('Diabetes Med', 'diabetes_med', ['Yes', 'No'])}
                {sel('Insulin', 'insulin', ['No', 'Down', 'Steady', 'Up'])}
                {sel('A1C Result', 'a1c_result', ['None', 'Norm', '>7', '>8'])}
                {sel('Glucose Serum', 'glucose_result', ['None', 'Norm', '>200', '>300'])}
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <LoadingAnimation /> : <><Brain size={18} /> Run AI Prediction</>}
          </button>
        </div>

        {/* Result Panel */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'modal-in 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div className={`prediction-result ${result.risk_category}`}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <CircularRisk probability={result.probability} risk={result.risk_category} />
                <div style={{ textAlign: 'center' }}>
                  <span className={`badge badge-${result.risk_category}`} style={{ fontSize: 16, padding: '8px 20px' }}>
                    {result.risk_category.toUpperCase()} RISK
                  </span>
                </div>
              </div>

              {/* Confidence Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Model Confidence</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${result.confidence * 100}%`, height: '100%', background: RISK_COLORS[result.risk_category], borderRadius: 3, transition: 'width 1s ease' }} />
                </div>
              </div>

              {/* Recommendation */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <AlertTriangle size={16} color={RISK_COLORS[result.risk_category]} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>AI Clinical Recommendation</span>
                </div>
                <div className="recommendation-card">{result.recommendation}</div>
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                <span><Activity size={12} style={{ display: 'inline', marginRight: 4 }} />Model v{result.model_version}</span>
                <span>{new Date(result.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Prediction;
