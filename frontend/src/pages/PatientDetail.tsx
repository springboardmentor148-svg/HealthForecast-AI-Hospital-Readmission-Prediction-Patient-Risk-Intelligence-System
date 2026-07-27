import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Brain, Calendar, User, Stethoscope } from 'lucide-react';
import { patientsApi } from '../api/patients';
import { predictionApi } from '../api/prediction';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const RiskBadge: React.FC<{ risk: string }> = ({ risk }) => (
  <span className={`badge badge-${risk}`}>{risk.toUpperCase()}</span>
);

const InfoRow: React.FC<{ label: string; value: string | number | null | undefined }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 500 }}>{value ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</span>
  </div>
);

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'clinical' | 'labs' | 'predictions'>('clinical');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.get(id!),
    enabled: !!id,
  });

  const { data: predictions } = useQuery({
    queryKey: ['patient-predictions', id],
    queryFn: () => predictionApi.listForPatient(id!, 1, 50),
    enabled: !!id,
  });

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)' }} />
      <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
    </div>
  );

  if (!patient) return (
    <div className="empty-state">
      <div className="empty-title">Patient not found</div>
      <button className="btn btn-primary mt-4" onClick={() => navigate('/patients')}>Back to Patients</button>
    </div>
  );

  const initials = patient.patient_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const chartData = predictions?.items.map((p) => ({
    date: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    probability: +(p.probability * 100).toFixed(1),
    risk: p.risk_category,
  })).reverse() ?? [];

  const latestRisk = predictions?.items[0]?.risk_category;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="breadcrumb mb-4" style={{ marginBottom: 16 }}>
        <Link to="/patients" style={{ color: 'var(--color-primary)' }}>Patients</Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">{patient.patient_name}</span>
      </div>

      {/* Hero Header */}
      <div className="card mb-4">
        <div className="card-body" style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'white', flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>{patient.patient_name}</h1>
              {latestRisk && <RiskBadge risk={latestRisk} />}
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 5, alignItems: 'center' }}><User size={13} />{patient.age} years &middot; {patient.gender}</span>
              {patient.attending_doctor && <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 5, alignItems: 'center' }}><Stethoscope size={13} />{patient.attending_doctor}</span>}
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', gap: 5, alignItems: 'center' }}><Calendar size={13} />Registered {new Date(patient.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => navigate('/patients')}>
              <ArrowLeft size={15} /> Back
            </button>
            <button className="btn btn-primary" onClick={() => navigate(`/prediction?patient_id=${patient.id}`)}>
              <Brain size={15} /> Run Prediction
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(['clinical', 'labs', 'predictions'] as const).map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'clinical' ? 'Clinical Info' : t === 'labs' ? 'Lab Results' : `Prediction History (${predictions?.total ?? 0})`}
          </button>
        ))}
      </div>

      {/* Tab: Clinical Info */}
      {tab === 'clinical' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Admission Details</h3></div>
            <div className="card-body">
              <InfoRow label="Admission Type" value={patient.admission_type} />
              <InfoRow label="Discharge Disposition" value={patient.discharge_disposition} />
              <InfoRow label="Admission Source" value={patient.admission_source} />
              <InfoRow label="Time in Hospital" value={patient.time_in_hospital != null ? `${patient.time_in_hospital} days` : null} />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Procedures & Visits</h3></div>
            <div className="card-body">
              <InfoRow label="Lab Procedures" value={patient.num_lab_procedures} />
              <InfoRow label="Procedures" value={patient.num_procedures} />
              <InfoRow label="Medications" value={patient.num_medications} />
              <InfoRow label="Outpatient Visits" value={patient.number_outpatient} />
              <InfoRow label="Emergency Visits" value={patient.number_emergency} />
              <InfoRow label="Inpatient Visits" value={patient.number_inpatient} />
            </div>
          </div>
          {(patient.diagnosis_1 || patient.diagnosis_2 || patient.diagnosis_3) && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header"><h3 className="card-title">Diagnoses (ICD Codes)</h3></div>
              <div className="card-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[patient.diagnosis_1, patient.diagnosis_2, patient.diagnosis_3].filter(Boolean).map((d, i) => (
                  <span key={i} className="badge badge-primary" style={{ fontSize: 13, padding: '6px 14px' }}>Dx{i + 1}: {d}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Lab Results */}
      {tab === 'labs' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Diabetes & Glucose</h3></div>
            <div className="card-body">
              <InfoRow label="Diabetes Medication" value={patient.diabetes_med} />
              <InfoRow label="Insulin" value={patient.insulin} />
              <InfoRow label="A1C Result" value={patient.a1c_result} />
              <InfoRow label="Glucose Serum" value={patient.glucose_result} />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Patient Demographics</h3></div>
            <div className="card-body">
              <InfoRow label="Name" value={patient.patient_name} />
              <InfoRow label="Age" value={`${patient.age} years`} />
              <InfoRow label="Gender" value={patient.gender} />
              <InfoRow label="Race" value={patient.race} />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Prediction History */}
      {tab === 'predictions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {chartData.length > 1 && (
            <div className="card">
              <div className="card-header"><h3 className="card-title">Risk Probability Over Time</h3></div>
              <div className="card-body" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Risk Probability']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                    <Line type="monotone" dataKey="probability" stroke="var(--color-primary)" strokeWidth={2} dot={{ fill: 'var(--color-primary)', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!predictions?.items.length ? (
            <div className="empty-state">
              <div className="empty-title">No predictions yet</div>
              <div className="empty-desc">Run the AI model to generate a readmission risk prediction for this patient.</div>
              <button className="btn btn-primary mt-4" onClick={() => navigate(`/prediction?patient_id=${patient.id}`)}><Brain size={15} /> Run First Prediction</button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Risk Category</th><th>Probability</th><th>Confidence</th><th>Recommendation</th><th>Date</th></tr></thead>
                <tbody>
                  {predictions.items.map((p) => (
                    <tr key={p.id}>
                      <td><RiskBadge risk={p.risk_category} /></td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ flex: 1, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: `${p.probability * 100}%`, height: '100%', background: p.risk_category === 'critical' ? 'var(--color-danger)' : p.risk_category === 'high' ? 'var(--risk-high)' : p.risk_category === 'moderate' ? 'var(--color-warning)' : 'var(--color-accent)', borderRadius: 3 }} /></div><span style={{ fontSize: 13, fontWeight: 600 }}>{(p.probability * 100).toFixed(1)}%</span></div></td>
                      <td>{(p.confidence * 100).toFixed(1)}%</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 300 }}>{p.recommendation}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(p.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientDetail;
