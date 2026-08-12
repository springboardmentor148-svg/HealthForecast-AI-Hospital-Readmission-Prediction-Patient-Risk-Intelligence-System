import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Card } from "../components/Card";
import RiskDial from "../components/RiskDial";
import RiskBadge from "../components/RiskBadge";
import api from "../lib/api";
import {
  RACE_OPTIONS, GENDER_OPTIONS, AGE_OPTIONS, ADMISSION_TYPE_OPTIONS,
  DISCHARGE_DISPOSITION_OPTIONS, ADMISSION_SOURCE_OPTIONS, GLU_SERUM_OPTIONS,
  A1C_OPTIONS, DOSAGE_OPTIONS, YES_NO_OPTIONS, CHANGE_OPTIONS,
  SINGLE_MED_FIELDS, COMBO_MED_FIELDS, DEFAULT_FEATURES, fieldLabel,
} from "../lib/featureOptions";

export default function RiskPrediction() {
  const [params] = useSearchParams();
  const patientId = params.get("patientId");
  const navigate = useNavigate();

  const [mrn, setMrn] = useState("");
  const [fullName, setFullName] = useState("");
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [existingPatient, setExistingPatient] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(!!patientId);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;
    api
      .get(`/patients/${patientId}`)
      .then((res) => {
        setExistingPatient(res.data);
        setMrn(res.data.mrn);
        setFullName(res.data.full_name);
        setFeatures({ ...DEFAULT_FEATURES, ...res.data.clinical_features });
      })
      .finally(() => setLoadingPatient(false));
  }, [patientId]);

  function setField(key, value) {
    setFeatures((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setResult(null);
    try {
      let targetPatientId = patientId;

      if (!targetPatientId) {
        const created = await api.post("/patients", {
          mrn,
          full_name: fullName,
          race: features.race,
          gender: features.gender,
          age_bracket: features.age,
          clinical_features: features,
        });
        targetPatientId = created.data.id;
      }

      const res = await api.post("/predictions/predict", {
        patient_id: targetPatientId,
        features,
      });
      setResult({ ...res.data, patientId: targetPatientId });
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong running this assessment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingPatient) {
    return (
      <DashboardLayout title="Risk Prediction">
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--line-soft)" }} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={existingPatient ? `Re-assess ${existingPatient.full_name}` : "New risk assessment"}
      subtitle="Enter encounter details to generate a readmission probability and care recommendations"
    >
      <div className="grid xl:grid-cols-3 gap-6 items-start">
        <form onSubmit={handleSubmit} className="xl:col-span-2 space-y-6">
          {!existingPatient && (
            <Card>
              <SectionHeading title="Patient identity" />
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label="Medical record number" value={mrn} onChange={setMrn} required placeholder="MRN-100987" />
                <TextField label="Full name" value={fullName} onChange={setFullName} required placeholder="Jane Doe" />
              </div>
            </Card>
          )}

          <Card>
            <SectionHeading title="Demographics" />
            <div className="grid sm:grid-cols-3 gap-4">
              <SelectField label="Race" value={features.race} onChange={(v) => setField("race", v)} options={RACE_OPTIONS} />
              <SelectField label="Gender" value={features.gender} onChange={(v) => setField("gender", v)} options={GENDER_OPTIONS} />
              <SelectField label="Age bracket" value={features.age} onChange={(v) => setField("age", v)} options={AGE_OPTIONS} />
            </div>
          </Card>

          <Card>
            <SectionHeading title="Encounter details" />
            <div className="grid sm:grid-cols-2 gap-4">
              <SelectField label="Admission type" value={features.admission_type_id} onChange={(v) => setField("admission_type_id", Number(v))} options={ADMISSION_TYPE_OPTIONS} objectOptions />
              <SelectField label="Discharge disposition" value={features.discharge_disposition_id} onChange={(v) => setField("discharge_disposition_id", Number(v))} options={DISCHARGE_DISPOSITION_OPTIONS} objectOptions />
              <SelectField label="Admission source" value={features.admission_source_id} onChange={(v) => setField("admission_source_id", Number(v))} options={ADMISSION_SOURCE_OPTIONS} objectOptions />
              <NumberField label="Time in hospital (days)" value={features.time_in_hospital} onChange={(v) => setField("time_in_hospital", v)} min={1} max={14} />
            </div>
          </Card>

          <Card>
            <SectionHeading title="Utilization" subtitle="Counts from the past year plus this encounter" />
            <div className="grid sm:grid-cols-3 gap-4">
              <NumberField label="Lab procedures" value={features.num_lab_procedures} onChange={(v) => setField("num_lab_procedures", v)} min={0} max={132} />
              <NumberField label="Procedures" value={features.num_procedures} onChange={(v) => setField("num_procedures", v)} min={0} max={6} />
              <NumberField label="Medications" value={features.num_medications} onChange={(v) => setField("num_medications", v)} min={0} max={81} />
              <NumberField label="Outpatient visits" value={features.number_outpatient} onChange={(v) => setField("number_outpatient", v)} min={0} max={42} />
              <NumberField label="Emergency visits" value={features.number_emergency} onChange={(v) => setField("number_emergency", v)} min={0} max={76} />
              <NumberField label="Inpatient stays" value={features.number_inpatient} onChange={(v) => setField("number_inpatient", v)} min={0} max={21} />
              <NumberField label="Diagnoses recorded" value={features.number_diagnoses} onChange={(v) => setField("number_diagnoses", v)} min={1} max={16} />
            </div>
          </Card>

          <Card>
            <SectionHeading title="Diagnoses & labs" subtitle="ICD-9 codes for primary/secondary/tertiary diagnoses" />
            <div className="grid sm:grid-cols-3 gap-4">
              <TextField label="Primary diagnosis (diag_1)" value={features.diag_1} onChange={(v) => setField("diag_1", v)} placeholder="e.g. 250, 428, 401" />
              <TextField label="Secondary diagnosis (diag_2)" value={features.diag_2} onChange={(v) => setField("diag_2", v)} placeholder="nan if none" />
              <TextField label="Tertiary diagnosis (diag_3)" value={features.diag_3} onChange={(v) => setField("diag_3", v)} placeholder="nan if none" />
              <SelectField label="Max glucose serum" value={features.max_glu_serum} onChange={(v) => setField("max_glu_serum", v)} options={GLU_SERUM_OPTIONS} />
              <SelectField label="A1C result" value={features.A1Cresult} onChange={(v) => setField("A1Cresult", v)} options={A1C_OPTIONS} />
            </div>
          </Card>

          <Card>
            <SectionHeading title="Medications" subtitle="Dosage change status during the encounter" />
            <div className="grid sm:grid-cols-3 gap-3.5">
              {SINGLE_MED_FIELDS.map((f) => (
                <SelectField key={f} label={fieldLabel(f)} value={features[f]} onChange={(v) => setField(f, v)} options={DOSAGE_OPTIONS} compact />
              ))}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide mt-5 mb-3" style={{ color: "var(--ink-soft)" }}>Combination therapies</p>
            <div className="grid sm:grid-cols-3 gap-3.5">
              {COMBO_MED_FIELDS.map((f) => (
                <SelectField key={f} label={fieldLabel(f)} value={features[f]} onChange={(v) => setField(f, v)} options={["No", "Steady"]} compact />
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-5" style={{ borderTop: "1px solid var(--line-soft)" }}>
              <SelectField label="Medication changed this encounter" value={features.change} onChange={(v) => setField("change", v)} options={CHANGE_OPTIONS} />
              <SelectField label="Prescribed diabetes medication" value={features.diabetesMed} onChange={(v) => setField("diabetesMed", v)} options={YES_NO_OPTIONS} />
            </div>
          </Card>

          {error && (
            <p className="text-sm rounded-lg px-4 py-3" style={{ background: "var(--risk-critical-soft)", color: "var(--risk-critical)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-3 rounded-lg text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            {submitting ? "Running model…" : "Run readmission risk assessment"}
          </button>
        </form>

        {/* Sticky result panel */}
        <div className="xl:sticky xl:top-24 space-y-4">
          <Card className="flex flex-col items-center text-center gap-4">
            <SectionHeading title="Predicted risk" noMargin />
            {result ? (
              <>
                <RiskDial probability={result.readmission_probability} category={result.risk_category} size={160} />
                <RiskBadge category={result.risk_category} />
              </>
            ) : (
              <div className="py-8">
                <RiskDial probability={0} category="Low" size={140} />
                <p className="text-xs mt-3" style={{ color: "var(--ink-soft)" }}>Submit the form to generate a prediction</p>
              </div>
            )}
          </Card>

          {result && (
            <Card>
              <h3 className="font-display text-base font-semibold mb-3" style={{ color: "var(--ink)" }}>Recommendations</h3>
              <ul className="space-y-2.5 mb-4">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-2.5 text-sm" style={{ color: "var(--ink)" }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--primary)" }} />
                    {r}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate(`/patients/${result.patientId}`)}
                className="w-full py-2.5 rounded-lg text-sm font-semibold border"
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                View patient profile →
              </button>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function SectionHeading({ title, subtitle, noMargin }) {
  return (
    <div className={noMargin ? "" : "mb-4"}>
      <h3 className="font-display text-base font-semibold" style={{ color: "var(--ink)" }}>{title}</h3>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>{subtitle}</p>}
    </div>
  );
}

function fieldClasses(compact) {
  return `w-full ${compact ? "px-2.5 py-2 text-xs" : "px-3.5 py-2.5 text-sm"} rounded-lg border outline-none`;
}

function TextField({ label, value, onChange, required, placeholder }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--ink-soft)" }}>{label}</span>
      <input
        type="text"
        required={required}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClasses(false)}
        style={{ borderColor: "var(--line)", background: "var(--paper-raised)" }}
      />
    </label>
  );
}

function NumberField({ label, value, onChange, min, max }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--ink-soft)" }}>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className={fieldClasses(false) + " font-mono"}
        style={{ borderColor: "var(--line)", background: "var(--paper-raised)" }}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options, objectOptions, compact }) {
  return (
    <label className="block">
      <span className={`block font-semibold uppercase tracking-wide mb-1.5 ${compact ? "text-[10px]" : "text-xs"}`} style={{ color: "var(--ink-soft)" }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClasses(compact)}
        style={{ borderColor: "var(--line)", background: "var(--paper-raised)", color: "var(--ink)" }}
      >
        {objectOptions
          ? options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)
          : options.map((o) => <option key={o} value={o}>{o === "nan" ? "Not recorded" : o}</option>)}
      </select>
    </label>
  );
}
