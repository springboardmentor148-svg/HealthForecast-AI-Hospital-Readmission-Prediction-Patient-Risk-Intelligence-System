"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ConfusionMatrix = { true_negative: number; false_positive: number; false_negative: number; true_positive: number };
type ModelMetrics = { accuracy?: number; precision?: number; recall?: number; f1_score?: number; roc_auc?: number; specificity?: number; confusion_matrix?: ConfusionMatrix };
type ModelEvaluation = { trained_at?: string; train_samples?: number; test_samples?: number; test_positive_cases?: number; test_negative_cases?: number; prediction_threshold?: number; feature_count?: number };
type Summary = { role: string; total_encounters: number; unique_patients: number; readmission_rate: number; high_risk_patients: number; model_status: string; model_name?: string; model_metrics?: ModelMetrics; model_comparison?: Record<string, ModelMetrics>; model_evaluation?: ModelEvaluation };
type Patient = { id: number; patient_nbr: string; race: string | null; gender: string | null; age: string | null; encounter_count: number; latest_risk_score: number | null; latest_risk_category: string | null };
type Encounter = { id: number; encounter_id: string; readmitted: string; time_in_hospital: number; age: string | null; admission_type_id: string | null; medical_specialty: string | null; a1c_result: string | null; medication_change: string | null; diabetes_med: string | null; insulin: string | null; number_inpatient: number; number_emergency: number; num_medications: number; risk_score: number | null; risk_category: string | null };
type Detail = Patient & { encounters: Encounter[] };
type Analytics = { group: string; encounters: number; readmissions: number; rate: number }[];
type Outcome = { outcome: string; count: number }[];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const palette = ["#0d9488", "#f59e0b", "#64748b"];

function riskClass(category: string | null) { return category ? category.toLowerCase() : "low"; }
function percent(value: number | undefined) { return value === undefined ? "—" : `${(value * 100).toFixed(2)}%`; }

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [tab, setTab] = useState("Overview");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [highRisk, setHighRisk] = useState<Patient[]>([]);
  const [readmission, setReadmission] = useState<Analytics>([]);
  const [treatment, setTreatment] = useState<Analytics>([]);
  const [outcomes, setOutcomes] = useState<Outcome>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  async function api<T>(path: string, init: RequestInit = {}) {
    const response = await fetch(`${API}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "Request failed");
    return payload as T;
  }

  useEffect(() => {
    const storedToken = localStorage.getItem("hf_token");
    if (!storedToken) { router.replace("/"); return; }
    setToken(storedToken); setName(localStorage.getItem("hf_name") || "User"); setRole(localStorage.getItem("hf_role") || "");
  }, [router]);

  useEffect(() => {
    if (!token || !role) return;
    Promise.all([
      api<Summary>("/dashboard"), api<Analytics>("/analytics/readmission"), api<Analytics>("/analytics/treatment"), api<Outcome>("/analytics/outcomes"),
      role !== "Healthcare Researcher" ? api<Patient[]>(`/patients?limit=${role === "System Administrator" ? 100 : 30}`) : Promise.resolve([]),
      role !== "Healthcare Researcher" ? api<Patient[]>("/patients/high-risk?limit=50") : Promise.resolve([]),
    ]).then(([summaryData, readmissionData, treatmentData, outcomeData, patientData, highRiskData]) => {
      setSummary(summaryData); setReadmission(readmissionData); setTreatment(treatmentData); setOutcomes(outcomeData); setPatients(patientData); setHighRisk(highRiskData); setLoading(false);
    }).catch((error: Error) => { setNotice(error.message); setLoading(false); });
  // Role is set with token and is deliberately included to fetch role-visible patients.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role]);

  async function openPatient(patientId: number) {
    try { setDetail(await api<Detail>(`/patients/${patientId}`)); setNotice(""); } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to load patient"); }
  }
  async function runPrediction(encounterId: string) {
    try {
      const prediction = await api<{ probability: number; risk_category: string; risk_signals: string[] }>(`/predictions/${encounterId}`, { method: "POST" });
      setNotice(`Risk prediction: ${Math.round(prediction.probability * 100)}% — ${prediction.risk_category}. ${prediction.risk_signals.join(" · ")}`);
      if (detail) openPatient(detail.id);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Prediction failed"); }
  }
  async function downloadReport(path: string, filename: string) {
    const response = await fetch(`${API}${path}`, { headers });
    if (!response.ok) { setNotice("This report is not available for your role."); return; }
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
  }
  function signOut() { localStorage.clear(); router.push("/"); }

  const nav = ["Overview", ...(role !== "Healthcare Researcher" ? ["Patients", "High-risk queue"] : []), "Treatment insights", "Analytics", "Reports", ...(role === "System Administrator" ? ["Model management"] : [])];
  if (loading) return <main className="grid min-h-screen place-items-center text-slate-600">Loading HealthForecast AI…</main>;

  return <main className="app-shell flex min-h-screen">
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block">
      <div className="mb-10 flex items-center gap-3 font-bold text-ink"><span className="rounded-xl bg-teal px-3 py-2 text-white">HF</span><span>HealthForecast<br /><small className="font-normal text-slate-500">AI platform</small></span></div>
      <nav className="space-y-1">{nav.map((item) => <button key={item} onClick={() => setTab(item)} className={`nav-button ${tab === item ? "active" : ""}`}>{item}</button>)}</nav>
      <div className="mt-10 rounded-xl bg-slate-50 p-3 text-xs text-slate-500"><b className="block text-ink">Educational demonstration</b>Use insights to support learning, not clinical decisions.</div>
      <button onClick={signOut} className="mt-6 w-full rounded-xl border border-slate-200 p-2 text-sm text-slate-600 hover:bg-slate-50">Sign out</button>
    </aside>
    <section className="min-w-0 flex-1 p-5 md:p-8">
      <header className="mb-7 flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wider text-teal">{role}</p><h1 className="mt-1 text-3xl font-bold text-ink">Good day, {name.split(" ")[0]}</h1><p className="mt-1 text-slate-500">Hospital readmission and patient risk intelligence.</p></div><div className="flex gap-2 lg:hidden"><select aria-label="Dashboard section" value={tab} onChange={(event) => setTab(event.target.value)} className="max-w-48 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"><>{nav.map((item) => <option key={item}>{item}</option>)}</></select><button onClick={signOut} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">Sign out</button></div></header>
      {notice && <div className="mb-5 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">{notice}<button className="float-right font-bold" onClick={() => setNotice("")}>×</button></div>}

      {tab === "Overview" && <Overview summary={summary} outcomes={outcomes} readmission={readmission} />}
      {tab === "Patients" && <Patients patients={patients} onOpen={openPatient} />}
      {tab === "High-risk queue" && <Patients patients={highRisk} onOpen={openPatient} highRisk />}
      {tab === "Treatment insights" && <Treatment data={treatment} token={token} />}
      {tab === "Analytics" && <AnalyticsView readmission={readmission} outcomes={outcomes} token={token} role={role} />}
      {tab === "Reports" && <Reports role={role} onDownload={downloadReport} />}
      {tab === "Model management" && <ModelManagement token={token} patients={patients} />}
    </section>
    {detail && <PatientDrawer detail={detail} onClose={() => setDetail(null)} onPredict={runPrediction} token={token} role={role} />}
  </main>;
}

function ModelStatusPanel({ summary }: { summary: Summary | null }) {
  const metrics = summary?.model_metrics;
  const evaluation = summary?.model_evaluation;
  const matrix = metrics?.confusion_matrix;
  const candidates = Object.entries(summary?.model_comparison || {});
  return <section className="card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-ink">Model status and evaluation</h2><p className="mt-1 text-sm text-slate-500">{summary?.model_status} · Selected model: <b className="text-ink">{summary?.model_name || "—"}</b></p></div><span className="pill low">30-day readmission classifier</span></div>{metrics && Object.keys(metrics).length > 0 ? <div className="mt-5 space-y-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{[["Accuracy", percent(metrics.accuracy)], ["Precision", percent(metrics.precision)], ["Recall", percent(metrics.recall)], ["F1-score", percent(metrics.f1_score)], ["ROC-AUC", percent(metrics.roc_auc)], ["Specificity", percent(metrics.specificity)]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-ink">{value}</p></div>)}</div><div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><section className="rounded-xl border border-slate-200 p-4"><h3 className="font-bold text-ink">Confusion matrix</h3><p className="mt-1 text-xs text-slate-500">Evaluation threshold: {evaluation?.prediction_threshold ?? 0.5}</p>{matrix && <div className="mt-3 overflow-x-auto"><table className="data-table text-center"><thead><tr><th>Actual / predicted</th><th>No readmission</th><th>Under 30 days</th></tr></thead><tbody><tr><th>No readmission</th><td className="font-bold text-teal">TN {matrix.true_negative.toLocaleString()}</td><td>FP {matrix.false_positive.toLocaleString()}</td></tr><tr><th>Under 30 days</th><td>FN {matrix.false_negative.toLocaleString()}</td><td className="font-bold text-teal">TP {matrix.true_positive.toLocaleString()}</td></tr></tbody></table></div>}</section><section className="rounded-xl border border-slate-200 p-4"><h3 className="font-bold text-ink">Evaluation setup</h3><dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Training records</dt><dd className="font-bold text-ink">{evaluation?.train_samples?.toLocaleString() || "—"}</dd></div><div><dt className="text-slate-500">Test records</dt><dd className="font-bold text-ink">{evaluation?.test_samples?.toLocaleString() || "—"}</dd></div><div><dt className="text-slate-500">Test positives</dt><dd className="font-bold text-ink">{evaluation?.test_positive_cases?.toLocaleString() || "—"}</dd></div><div><dt className="text-slate-500">Test negatives</dt><dd className="font-bold text-ink">{evaluation?.test_negative_cases?.toLocaleString() || "—"}</dd></div><div><dt className="text-slate-500">Input features</dt><dd className="font-bold text-ink">{evaluation?.feature_count || "—"}</dd></div><div><dt className="text-slate-500">Last trained</dt><dd className="font-bold text-ink">{evaluation?.trained_at ? new Date(evaluation.trained_at).toLocaleString() : "—"}</dd></div></dl></section></div>{candidates.length > 0 && <section className="overflow-x-auto"><h3 className="mb-3 font-bold text-ink">Candidate model comparison</h3><table className="data-table"><thead><tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1-score</th><th>ROC-AUC</th><th>Specificity</th></tr></thead><tbody>{candidates.map(([name, candidate]) => <tr key={name} className={name === summary?.model_name ? "bg-teal-50" : ""}><td className="font-bold text-ink">{name}{name === summary?.model_name ? " (selected)" : ""}</td><td>{percent(candidate.accuracy)}</td><td>{percent(candidate.precision)}</td><td>{percent(candidate.recall)}</td><td>{percent(candidate.f1_score)}</td><td>{percent(candidate.roc_auc)}</td><td>{percent(candidate.specificity)}</td></tr>)}</tbody></table><p className="mt-2 text-xs text-slate-500">The model with the strongest ROC-AUC is selected because this readmission target is imbalanced.</p></section>}</div> : <p className="mt-3 text-sm text-slate-600">Run local training to generate full model statistics and a confusion matrix.</p>}</section>;
}

function Overview({ summary, outcomes, readmission }: { summary: Summary | null; outcomes: Outcome; readmission: Analytics }) {
  const metrics = [["Encounters", summary?.total_encounters.toLocaleString() || "—"], ["Patients", summary?.unique_patients.toLocaleString() || "—"], ["30-day readmission", `${summary?.readmission_rate || 0}%`], ["High-risk flagged", summary?.high_risk_patients.toLocaleString() || "0"]];
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <div key={label} className="metric-card"><p className="metric-label">{label}</p><p className="metric-value">{value}</p></div>)}</div><div className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]"><section className="card p-5"><h2 className="font-bold text-ink">Readmission rate by age group</h2><p className="mb-4 text-sm text-slate-500">Observed under-30-day outcomes in the supplied dataset.</p><div className="h-72"><ResponsiveContainer><BarChart data={readmission}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="group" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Bar dataKey="rate" name="Readmission rate (%)" fill="#0d9488" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></section><section className="card p-5"><h2 className="font-bold text-ink">Readmission outcome mix</h2><p className="mb-4 text-sm text-slate-500">NO, over 30 days, and under 30 days.</p><div className="h-72"><ResponsiveContainer><PieChart><Pie data={outcomes} dataKey="count" nameKey="outcome" innerRadius={60} outerRadius={95} paddingAngle={3}>{outcomes.map((entry, index) => <Cell key={entry.outcome} fill={palette[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></section></div><ModelStatusPanel summary={summary} /></div>;
}

function Patients({ patients, onOpen, highRisk = false }: { patients: Patient[]; onOpen: (id: number) => void; highRisk?: boolean }) {
  return <section className="card overflow-hidden"><div className="flex items-center justify-between p-5"><div><h2 className="font-bold text-ink">{highRisk ? "High-risk patient queue" : "Patient records"}</h2><p className="text-sm text-slate-500">{highRisk ? "Patients flagged by risk score or high-utilization clinical signals." : "Patients visible within your role’s permitted scope."}</p></div><span className="pill high">{patients.length} patients</span></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Patient</th><th>Age</th><th>Demographics</th><th>Encounters</th><th>Risk</th><th /></tr></thead><tbody>{patients.map((patient) => <tr key={patient.id}><td className="font-semibold text-ink">#{patient.patient_nbr}</td><td>{patient.age || "Unknown"}</td><td>{[patient.race, patient.gender].filter(Boolean).join(" · ") || "Unknown"}</td><td>{patient.encounter_count}</td><td><span className={`pill ${riskClass(patient.latest_risk_category || (highRisk ? "High" : "Low"))}`}>{patient.latest_risk_category || (highRisk ? "High signal" : "Not scored")}</span></td><td><button onClick={() => onOpen(patient.id)} className="font-bold text-teal hover:text-teal-700">View</button></td></tr>)}</tbody></table></div></section>;
}

type MedicationAnalytics = { insulin: Analytics; diabetes_medication: Analytics; a1c: Analytics };
type Performance = { specialties: { specialty: string; encounters: number; readmissions: number; rate: number }[]; utilization: { prior_inpatient_visits: number; encounters: number; readmissions: number; rate: number }[]; note: string };
type CarePlan = { id: number; recommendation: string; follow_up_status: string; notes: string | null; created_at: string };

function OutcomeTable({ title, rows }: { title: string; rows: Analytics }) { return <section className="rounded-xl border border-slate-200 p-4"><h3 className="font-bold text-ink">{title}</h3><div className="mt-3 overflow-x-auto"><table className="data-table"><thead><tr><th>Group</th><th>Encounters</th><th>Under-30</th><th>Rate</th></tr></thead><tbody>{rows.map((row) => <tr key={row.group}><td>{row.group}</td><td>{row.encounters.toLocaleString()}</td><td>{row.readmissions.toLocaleString()}</td><td>{row.rate}%</td></tr>)}</tbody></table></div></section>; }

function Treatment({ data, token }: { data: Analytics; token: string }) {
  const [medications, setMedications] = useState<MedicationAnalytics | null>(null);
  useEffect(() => { fetch(`${API}/analytics/medications`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok ? r.json() : null).then(setMedications).catch(() => setMedications(null)); }, [token]);
  return <div className="space-y-6"><div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]"><section className="card p-5"><h2 className="font-bold text-ink">Treatment-effectiveness view</h2><p className="mb-4 text-sm text-slate-500">Observed medication-change and 30-day readmission patterns; these are not causal treatment effects.</p><div className="h-80"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="group" /><YAxis /><Tooltip /><Bar dataKey="rate" name="Readmission rate (%)" fill="#f59e0b" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></section><section className="card p-5"><h2 className="font-bold text-ink">Clinical decision support</h2><ul className="mt-5 space-y-4 text-sm text-slate-600"><li><b className="text-ink">High risk:</b> review discharge plan and schedule follow-up.</li><li><b className="text-ink">Repeated visits:</b> assess prior inpatient and emergency use.</li><li><b className="text-ink">Medication burden:</b> review medication education needs.</li><li><b className="text-ink">HbA1c:</b> consider monitoring where recorded.</li></ul></section></div>{medications && <section className="card p-5"><h2 className="font-bold text-ink">Medication, HbA1c, and recovery outcome patterns</h2><p className="mb-4 text-sm text-slate-500">The dataset has no direct recovery measure, so readmission is shown as the available outcome proxy.</p><div className="grid gap-4 xl:grid-cols-3"><OutcomeTable title="Insulin outcomes" rows={medications.insulin} /><OutcomeTable title="Diabetes-medication outcomes" rows={medications.diabetes_medication} /><OutcomeTable title="HbA1c outcome pattern" rows={medications.a1c} /></div></section>}</div>;
}

function AnalyticsView({ readmission, outcomes, token, role }: { readmission: Analytics; outcomes: Outcome; token: string; role: string }) {
  const [performance, setPerformance] = useState<Performance | null>(null);
  const canViewPerformance = ["Hospital Administrator", "Healthcare Researcher", "System Administrator"].includes(role);
  useEffect(() => { if (!canViewPerformance) return; fetch(`${API}/analytics/performance`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok ? r.json() : null).then(setPerformance).catch(() => setPerformance(null)); }, [token, canViewPerformance]);
  return <div className="space-y-6"><section className="card p-5"><h2 className="font-bold text-ink">Population health and patient outcome analysis</h2><div className="mt-4 overflow-x-auto"><table className="data-table"><thead><tr><th>Age group</th><th>Encounters</th><th>Under-30 readmissions</th><th>Readmission rate</th></tr></thead><tbody>{readmission.map((row) => <tr key={row.group}><td>{row.group}</td><td>{row.encounters.toLocaleString()}</td><td>{row.readmissions.toLocaleString()}</td><td>{row.rate}%</td></tr>)}</tbody></table></div></section><section className="card p-5"><h2 className="font-bold text-ink">Healthcare outcome summary</h2><div className="mt-4 grid gap-3 sm:grid-cols-3">{outcomes.map((item) => <div key={item.outcome} className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">{item.outcome}</p><p className="mt-1 text-2xl font-bold text-ink">{item.count.toLocaleString()}</p></div>)}</div></section>{performance && <section className="card p-5"><h2 className="font-bold text-ink">Department and clinical performance</h2><p className="mt-1 text-sm text-slate-500">{performance.note}</p><div className="mt-4 grid gap-5 xl:grid-cols-2"><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Department proxy</th><th>Encounters</th><th>Rate</th></tr></thead><tbody>{performance.specialties.map((row) => <tr key={row.specialty}><td>{row.specialty}</td><td>{row.encounters.toLocaleString()}</td><td>{row.rate}%</td></tr>)}</tbody></table></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Prior inpatient visits</th><th>Encounters</th><th>Rate</th></tr></thead><tbody>{performance.utilization.map((row) => <tr key={row.prior_inpatient_visits}><td>{row.prior_inpatient_visits}</td><td>{row.encounters.toLocaleString()}</td><td>{row.rate}%</td></tr>)}</tbody></table></div></div></section>}</div>;
}

function Reports({ role, onDownload }: { role: string; onDownload: (path: string, filename: string) => void }) { const canResearch = ["Healthcare Researcher", "System Administrator"].includes(role); const canOperations = ["Hospital Administrator", "System Administrator"].includes(role); return <section className="card max-w-2xl p-6"><h2 className="font-bold text-ink">Reports and exports</h2><p className="mt-2 text-slate-600">Reports use only available dataset fields. Research exports exclude patient and encounter identifiers; hospital reports use specialty as a department proxy.</p><div className="mt-5 flex flex-wrap gap-3">{canResearch && <button onClick={() => onDownload("/reports/research.csv", "healthforecast_anonymized_research.csv")} className="rounded-xl bg-teal px-4 py-3 font-bold text-white hover:bg-teal-700">Download anonymized research CSV</button>}{canOperations && <button onClick={() => onDownload("/reports/operations.csv", "healthforecast_operations_report.csv")} className="rounded-xl border border-teal bg-white px-4 py-3 font-bold text-teal hover:bg-teal-50">Download hospital operations CSV</button>}</div>{!canResearch && !canOperations && <p className="mt-5 text-sm text-slate-500">Use each patient record to review the admission history, risk result, and follow-up plan available to your role.</p>}<p className="mt-4 text-xs text-slate-500">Current role: {role}.</p></section>; }

function ModelManagement({ token, patients }: { token: string; patients: Patient[] }) {
  const [models, setModels] = useState<{ id: number; name: string; metrics: Record<string, unknown>; is_active: boolean }[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string; email: string; role: string; is_active: boolean }[]>([]);
  const [assignments, setAssignments] = useState<{ id: number; doctor_id: number; doctor: string; patient_id: number; patient_nbr: string; age: string | null }[]>([]);
  const [training, setTraining] = useState<{ running: boolean; message: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "Doctor" });
  const [assignment, setAssignment] = useState({ doctor_id: "", patient_id: "" });
  const [message, setMessage] = useState("");
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  function load() {
    fetch(`${API}/models`, { headers }).then((response) => response.json()).then(setModels);
    fetch(`${API}/users`, { headers }).then((response) => response.json()).then(setUsers);
    fetch(`${API}/assignments`, { headers }).then((response) => response.json()).then(setAssignments);
    fetch(`${API}/models/training-status`, { headers }).then((response) => response.json()).then(setTraining);
  }
  useEffect(load, [token]);
  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(`${API}/users`, { method: "POST", headers, body: JSON.stringify(form) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.detail || "Unable to create user"); return; }
    setMessage(`Created ${result.name}.`); setForm({ name: "", email: "", password: "", role: "Doctor" }); load();
  }
  async function activateModel(modelId: number) { const response = await fetch(`${API}/models/${modelId}/activate`, { method: "POST", headers }); const result = await response.json(); setMessage(response.ok ? `${result.name} is now active.` : result.detail || "Unable to activate model"); if (response.ok) load(); }
  async function retrainModel() { const response = await fetch(`${API}/models/retrain`, { method: "POST", headers }); const result = await response.json(); setMessage(response.ok ? "Local retraining has started. Refresh model management after it completes." : result.detail || "Unable to start retraining"); setTraining(result); }
  async function createAssignment(event: React.FormEvent) { event.preventDefault(); const response = await fetch(`${API}/assignments`, { method: "POST", headers, body: JSON.stringify({ doctor_id: Number(assignment.doctor_id), patient_id: Number(assignment.patient_id) }) }); const result = await response.json(); if (!response.ok) { setMessage(result.detail || "Unable to assign patient"); return; } setAssignment({ doctor_id: "", patient_id: "" }); setMessage("Doctor-patient assignment saved."); load(); }
  const doctors = users.filter((user) => user.role === "Doctor");
  return <div className="grid gap-6 xl:grid-cols-2"><section className="card p-6"><h2 className="font-bold text-ink">AI model management</h2><p className="mt-2 text-sm text-slate-500">Metrics are generated by the supplied training script. Activation controls the currently selected version.</p><div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600"><b className="text-ink">Local training:</b> {training?.message || "Checking status…"}</div><div className="mt-3 flex flex-wrap gap-2"><button disabled={training?.running} onClick={retrainModel} className="rounded-lg bg-teal px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{training?.running ? "Training in progress…" : "Retrain from supplied dataset"}</button><button onClick={load} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600">Refresh status</button></div><div className="mt-5 space-y-3">{models.map((model) => <div className="rounded-xl border border-slate-200 p-4" key={model.id}><div className="flex items-center justify-between gap-3"><b>{model.name}</b>{model.is_active ? <span className="pill low">Active</span> : <button onClick={() => activateModel(model.id)} className="rounded-lg border border-teal px-2 py-1 text-xs font-bold text-teal">Set active</button>}</div><pre className="mt-3 overflow-auto text-xs text-slate-600">{JSON.stringify(model.metrics, null, 2)}</pre></div>)}</div></section><section className="card p-6"><h2 className="font-bold text-ink">User management</h2><form className="mt-4 grid gap-3" onSubmit={createUser}><input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-slate-200 p-2" /><input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-lg border border-slate-200 p-2" /><input required minLength={8} type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-lg border border-slate-200 p-2" /><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="rounded-lg border border-slate-200 p-2"><option>Doctor</option><option>Hospital Administrator</option><option>Healthcare Researcher</option><option>System Administrator</option></select><button className="rounded-lg bg-teal px-3 py-2 font-bold text-white">Create user</button></form>{message && <p className="mt-3 text-sm text-teal-700">{message}</p>}<div className="mt-6 max-h-52 overflow-auto"><table className="data-table"><thead><tr><th>User</th><th>Role</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><b>{user.name}</b><span className="block text-xs text-slate-500">{user.email}</span></td><td>{user.role}</td></tr>)}</tbody></table></div></section><section className="card p-6"><h2 className="font-bold text-ink">Doctor assignment management</h2><p className="mt-2 text-sm text-slate-500">Assign a visible patient record to a doctor for their protected workflow.</p><form className="mt-4 grid gap-3" onSubmit={createAssignment}><select required value={assignment.doctor_id} onChange={(e) => setAssignment({ ...assignment, doctor_id: e.target.value })} className="rounded-lg border border-slate-200 p-2"><option value="">Select doctor</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}</select><select required value={assignment.patient_id} onChange={(e) => setAssignment({ ...assignment, patient_id: e.target.value })} className="rounded-lg border border-slate-200 p-2"><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>#{patient.patient_nbr} · {patient.age || "Unknown age"}</option>)}</select><button className="rounded-lg bg-teal px-3 py-2 font-bold text-white">Assign patient</button></form><div className="mt-5 max-h-52 overflow-auto"><table className="data-table"><thead><tr><th>Doctor</th><th>Patient</th></tr></thead><tbody>{assignments.map((item) => <tr key={item.id}><td>{item.doctor}</td><td>#{item.patient_nbr} · {item.age || "Unknown"}</td></tr>)}</tbody></table></div></section></div>;
}

function PatientDrawer({ detail, onClose, onPredict, token, role }: { detail: Detail; onClose: () => void; onPredict: (id: string) => void; token: string; role: string }) {
  const [plans, setPlans] = useState<CarePlan[]>([]); const [plan, setPlan] = useState(""); const [followUpStatus, setFollowUpStatus] = useState("Planned"); const [notes, setNotes] = useState(""); const [careMessage, setCareMessage] = useState("");
  const canCreatePlan = ["Doctor", "System Administrator"].includes(role);
  function loadPlans() { fetch(`${API}/patients/${detail.id}/care-plans`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.ok ? r.json() : []).then(setPlans).catch(() => setPlans([])); }
  useEffect(loadPlans, [detail.id, token]);
  async function savePlan(event: React.FormEvent) { event.preventDefault(); const response = await fetch(`${API}/patients/${detail.id}/care-plans`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ recommendation: plan, follow_up_status: followUpStatus, notes: notes || null }) }); const result = await response.json(); if (!response.ok) { setCareMessage(result.detail || "Unable to save care plan"); return; } setPlan(""); setNotes(""); setCareMessage("Care plan and follow-up status saved."); loadPlans(); }
  return <div className="fixed inset-0 z-50 bg-slate-950/35" onClick={onClose}><aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-sm font-bold uppercase text-teal">Patient record</p><h2 className="text-2xl font-bold text-ink">#{detail.patient_nbr}</h2><p className="text-slate-500">{[detail.age, detail.race, detail.gender].filter(Boolean).join(" · ")}</p></div><button onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-1">Close</button></div><section className="mt-7"><h3 className="font-bold text-ink">Medical, treatment, and admission history</h3><div className="mt-3 space-y-3">{detail.encounters.map((encounter) => <article className="rounded-xl border border-slate-200 p-4" key={encounter.id}><div className="flex flex-wrap items-center justify-between gap-2"><b>Encounter #{encounter.encounter_id}</b><span className={`pill ${riskClass(encounter.risk_category)}`}>{encounter.risk_category || "Not scored"}</span></div><p className="mt-2 text-sm text-slate-600">Stay: {encounter.time_in_hospital} days · Readmitted: {encounter.readmitted} · Admission type: {encounter.admission_type_id || "Unknown"} · Specialty: {encounter.medical_specialty || "Unknown"}</p><p className="mt-1 text-sm text-slate-600">HbA1c: {encounter.a1c_result || "Not recorded"} · Medication change: {encounter.medication_change || "Unknown"} · Diabetes medication: {encounter.diabetes_med || "Unknown"} · Insulin: {encounter.insulin || "Unknown"}</p><p className="mt-1 text-sm text-slate-600">Prior inpatient: {encounter.number_inpatient} · Prior emergency: {encounter.number_emergency} · Medications: {encounter.num_medications}</p><button className="mt-3 rounded-lg bg-teal px-3 py-2 text-sm font-bold text-white hover:bg-teal-700" onClick={() => onPredict(encounter.encounter_id)}>Generate risk prediction</button></article>)}</div></section><section className="mt-7 rounded-xl bg-slate-50 p-4"><h3 className="font-bold text-ink">Care plan and follow-up tracking</h3>{canCreatePlan && <form onSubmit={savePlan} className="mt-3 grid gap-3"><textarea required value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Discharge support, risk mitigation, or follow-up plan" className="min-h-24 rounded-lg border border-slate-200 p-2" /><select value={followUpStatus} onChange={(e) => setFollowUpStatus(e.target.value)} className="rounded-lg border border-slate-200 p-2"><option>Planned</option><option>Scheduled</option><option>Completed</option></select><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Follow-up notes (optional)" className="min-h-16 rounded-lg border border-slate-200 p-2" /><button className="rounded-lg bg-teal px-3 py-2 text-sm font-bold text-white">Save care plan</button></form>}{careMessage && <p className="mt-3 text-sm text-teal-700">{careMessage}</p>}<div className="mt-4 space-y-2">{plans.length ? plans.map((item) => <article className="rounded-lg border border-slate-200 bg-white p-3" key={item.id}><div className="flex justify-between gap-3"><b className="text-sm text-ink">{item.follow_up_status}</b><span className="text-xs text-slate-500">Created: {new Date(item.created_at).toLocaleDateString()}</span></div><p className="mt-1 text-sm text-slate-600">{item.recommendation}</p>{item.notes && <p className="mt-1 text-xs text-slate-500">Notes: {item.notes}</p>}</article>) : <p className="text-sm text-slate-500">No care plan has been recorded for this patient.</p>}</div></section></aside></div>;
}
