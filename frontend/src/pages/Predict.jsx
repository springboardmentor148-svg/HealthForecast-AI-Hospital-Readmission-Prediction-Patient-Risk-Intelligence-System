import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ClipboardCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Card, SectionLabel, RiskBadge } from "../components/ui";
import { RiskGauge } from "../components/RiskGauge";
import { api } from "../api";

const FALLBACK_OPTIONS = {
  age_grouped: ["<30", "[30,50)", "[50,70)", "[70,100)"],
  race: ["Caucasian", "AfricanAmerican", "Hispanic", "Asian", "Other", "Missing"],
  med_specialty_grouped: ["InternalMedicine", "Cardiology", "Surgery-General", "Family/GeneralPractice", "Missing", "Other"],
  primary_diagnosis: ["Diabetes", "Circulatory", "Respiratory", "Digestive", "Genitourinary", "Injury", "Musculoskeletal", "Neoplasms", "Other"],
  secondary_diagnosis: ["Diabetes", "Circulatory", "Respiratory", "Digestive", "Genitourinary", "Injury", "Musculoskeletal", "Neoplasms", "Other"],
  tertiary_diagnosis: ["Diabetes", "Circulatory", "Respiratory", "Digestive", "Genitourinary", "Injury", "Musculoskeletal", "Neoplasms", "Other"],
  hba1c_grouped: ["Not measured", "Normal", "High, changed", "High, not changed"],
  discharge_grouped: ["Home", "Home_with_care", "Transferred_facility", "Other"],
  admission_grouped: ["Emergency", "Referral", "Transfer", "Other"],
};

const DEFAULT_FORM = {
  age: "[50,70)",
  race: "Caucasian",
  medSpecialty: "InternalMedicine",
  diag: "Circulatory",
  secondaryDiag: "Diabetes",
  tertiaryDiag: "Other",
  hba1c: "Not measured",
  discharge: "Home",
  admission: "Emergency",

  stay: 6,
  labProcedures: 40,
  procedures: 1,
  medications: 12,
  priorOutpatient: 0,
  priorEmergency: 0,
  priorInpatient: 1,
  numDiagnoses: 7,

  insulin: false,
  diabetesMed: true,
  medicationChanged: false,
};

function buildApiPayload(form) {
  return {
    age_grouped: form.age,
    race: form.race,
    med_specialty_grouped: form.medSpecialty,
    primary_diagnosis: form.diag,
    secondary_diagnosis: form.secondaryDiag,
    tertiary_diagnosis: form.tertiaryDiag,
    hba1c_grouped: form.hba1c,
    discharge_grouped: form.discharge,
    admission_grouped: form.admission,

    time_in_hospital: form.stay,
    num_lab_procedures: form.labProcedures,
    num_procedures: form.procedures,
    num_medications: form.medications,
    number_outpatient: form.priorOutpatient,
    number_emergency: form.priorEmergency,
    number_inpatient: form.priorInpatient,
    number_diagnoses: form.numDiagnoses,
    insulin_flag: form.insulin ? 1 : 0,
    diabetesMed_flag: form.diabetesMed ? 1 : 0,
    change_flag: form.medicationChanged ? 1 : 0,
  };
}

export default function Predict() {
  const { theme: C } = useTheme();
  const [options, setOptions] = useState(FALLBACK_OPTIONS);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    api.options().then((o) => setOptions((prev) => ({ ...prev, ...o }))).catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const data = await api.predict(buildApiPayload(form));
      setResult(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  const score = result ? result.probability : 0.02;
  const factors = result?.top_factors || [];
  const maxAbsImpact = Math.max(...factors.map((f) => Math.abs(f.impact)), 0.01);

  return (
    <div>
      <h1 style={{ fontFamily: C.serif, fontSize: 26, color: C.ink, margin: 0, fontWeight: 600 }}>Score a patient</h1>
      <p style={{ fontFamily: C.sans, color: C.inkMuted, fontSize: 13.5, marginTop: 6, marginBottom: 22 }}>
        Every field here feeds the real model. Contributing factors are real SHAP values, not an approximation.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <SectionLabel>Patient</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
              <Field label="Age band">
                <Select value={form.age} onChange={(v) => set("age", v)} options={options.age_grouped} />
              </Field>
              <Field label="Race">
                <Select value={form.race} onChange={(v) => set("race", v)} options={options.race} />
              </Field>
            </div>
          </Card>

          <Card>
            <SectionLabel>Diagnoses</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 12 }}>
              <Field label="Primary">
                <Select value={form.diag} onChange={(v) => set("diag", v)} options={options.primary_diagnosis} />
              </Field>
              <Field label="Secondary">
                <Select value={form.secondaryDiag} onChange={(v) => set("secondaryDiag", v)} options={options.secondary_diagnosis} />
              </Field>
              <Field label="Tertiary">
                <Select value={form.tertiaryDiag} onChange={(v) => set("tertiaryDiag", v)} options={options.tertiary_diagnosis} />
              </Field>
            </div>
          </Card>

          <Card>
            <SectionLabel>Encounter details</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
              <Field label="Medical specialty">
                <Select value={form.medSpecialty} onChange={(v) => set("medSpecialty", v)} options={options.med_specialty_grouped} />
              </Field>
              <Field label="Admission source">
                <Select value={form.admission} onChange={(v) => set("admission", v)} options={options.admission_grouped} />
              </Field>
              <Field label="Discharge disposition">
                <Select value={form.discharge} onChange={(v) => set("discharge", v)} options={options.discharge_grouped} />
              </Field>
              <Field label="Time in hospital (days)">
                <NumberInput value={form.stay} onChange={(v) => set("stay", v)} min={1} max={14} />
              </Field>
              <Field label="Lab procedures performed">
                <NumberInput value={form.labProcedures} onChange={(v) => set("labProcedures", v)} min={0} max={150} />
              </Field>
              <Field label="Procedures performed">
                <NumberInput value={form.procedures} onChange={(v) => set("procedures", v)} min={0} max={10} />
              </Field>
              <Field label="Medications given">
                <NumberInput value={form.medications} onChange={(v) => set("medications", v)} min={0} max={100} />
              </Field>
              <Field label="Number of diagnoses">
                <NumberInput value={form.numDiagnoses} onChange={(v) => set("numDiagnoses", v)} min={1} max={20} />
              </Field>
            </div>
          </Card>

          <Card>
            <SectionLabel>Prior utilization (last 12 months)</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 12 }}>
              <Field label="Inpatient visits">
                <NumberInput value={form.priorInpatient} onChange={(v) => set("priorInpatient", v)} min={0} max={50} />
              </Field>
              <Field label="Emergency visits">
                <NumberInput value={form.priorEmergency} onChange={(v) => set("priorEmergency", v)} min={0} max={50} />
              </Field>
              <Field label="Outpatient visits">
                <NumberInput value={form.priorOutpatient} onChange={(v) => set("priorOutpatient", v)} min={0} max={50} />
              </Field>
            </div>
          </Card>

          <Card>
            <SectionLabel>Diabetes management</SectionLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
              <Field label="HbA1c result">
                <Select value={form.hba1c} onChange={(v) => set("hba1c", v)} options={options.hba1c_grouped} />
              </Field>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                <Checkbox label="On insulin" checked={form.insulin} onChange={(v) => set("insulin", v)} />
                <Checkbox label="On diabetes medication" checked={form.diabetesMed} onChange={(v) => set("diabetesMed", v)} />
                <Checkbox label="Medication changed this stay" checked={form.medicationChanged} onChange={(v) => set("medicationChanged", v)} />
              </div>
            </div>
          </Card>

          <div>
            <button
              onClick={handleSubmit}
              disabled={status === "loading"}
              style={{
                background: C.teal, color: "#fff", border: "none", borderRadius: 7,
                padding: "10px 18px", fontFamily: C.sans, fontSize: 13.5, fontWeight: 600,
                cursor: status === "loading" ? "default" : "pointer",
                opacity: status === "loading" ? 0.7 : 1,
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              <Search size={14} /> {status === "loading" ? "Scoring…" : "Calculate risk score"}
            </button>
            {status === "error" && (
              <div style={{
                marginTop: 10, fontFamily: C.sans, fontSize: 12, color: C.high,
                background: C.highPale, padding: "8px 10px", borderRadius: 6,
              }}>
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", minHeight: 250 }}>
              <SectionLabel>Predicted risk</SectionLabel>
              <div style={{ position: "relative", width: 260 }}>
                <motion.div animate={{ opacity: status === "loading" ? 0.25 : 1 }} transition={{ duration: 0.25 }}>
                  <RiskGauge score={score} />
                </motion.div>
                <AnimatePresence>
                  {status === "loading" && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                        style={{ width: 46, height: 46, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.teal }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <RiskBadge score={score} />
              {result && (
                <div style={{ fontFamily: C.mono, fontSize: 10.5, color: C.inkFaint, marginTop: 8 }}>
                  threshold used: {result.threshold_used}
                </div>
              )}
              {!result && status !== "loading" && (
                <div style={{ fontFamily: C.sans, fontSize: 11, color: C.inkFaint, marginTop: 8, textAlign: "center" }}>
                  Fill in the form and calculate a score
                </div>
              )}
            </Card>

            <Card>
              <SectionLabel>Top contributing factors {result ? "(real SHAP values)" : ""}</SectionLabel>
              {!result && (
                <div style={{ fontFamily: C.sans, fontSize: 12, color: C.inkFaint, marginTop: 8 }}>
                  Calculate a score to see the model's actual reasoning for this patient.
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 8 }}>
                {factors.map((f, i) => {
                  const pushesUp = f.impact > 0;
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: C.sans, fontSize: 11.5, color: C.inkMuted, marginBottom: 3 }}>
                        <span>{f.feature}</span>
                        <span style={{ fontFamily: C.mono, color: pushesUp ? C.high : C.low, fontWeight: 600 }}>
                          {pushesUp ? "+" : ""}{f.impact.toFixed(3)}
                        </span>
                      </div>
                      <div style={{ height: 6, background: C.surfaceAlt, borderRadius: 3 }}>
                        <div style={{
                          height: 6, width: `${(Math.abs(f.impact) / maxAbsImpact) * 100}%`,
                          background: pushesUp ? C.high : C.low, borderRadius: 3,
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {result && (
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <ClipboardCheck size={13} color={C.teal} />
                  <SectionLabel>Suggested next steps</SectionLabel>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex", gap: 8, fontFamily: C.sans, fontSize: 12.5,
                        color: C.ink, lineHeight: 1.5, background: C.surfaceAlt,
                        padding: "9px 11px", borderRadius: 7,
                      }}
                    >
                      <span style={{ color: C.teal, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: C.sans, fontSize: 10.5, color: C.inkFaint, marginTop: 10, lineHeight: 1.5 }}>
                  Rule-based suggestions derived from this encounter's fields and risk band —
                  a starting point for clinical judgment, not a directive.
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  const { theme: C } = useTheme();
  return (
    <div>
      <div style={{ fontFamily: C.sans, fontSize: 11.5, color: C.inkMuted, marginBottom: 5, fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
}
function Select({ value, onChange, options = [] }) {
  const { theme: C } = useTheme();
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`,
        fontFamily: C.sans, fontSize: 13, color: C.ink, background: C.surface,
      }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
function NumberInput({ value, onChange, min, max }) {
  const { theme: C } = useTheme();
  return (
    <input
      type="number" value={value} min={min} max={max}
      onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
      style={{
        width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`,
        fontFamily: C.mono, fontSize: 13, color: C.ink, background: C.surface, boxSizing: "border-box",
      }}
    />
  );
}
function Checkbox({ label, checked, onChange }) {
  const { theme: C } = useTheme();
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: C.sans, fontSize: 13, color: C.ink, cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 15, height: 15, accentColor: C.teal }} />
      {label}
    </label>
  );
}
