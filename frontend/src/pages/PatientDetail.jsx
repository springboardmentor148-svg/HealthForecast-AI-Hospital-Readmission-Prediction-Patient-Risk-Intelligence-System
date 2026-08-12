import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { Card } from "../components/Card";
import RiskDial from "../components/RiskDial";
import RiskBadge from "../components/RiskBadge";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatPercent } from "../lib/format";

const FEATURE_GROUPS = [
  {
    title: "Encounter",
    fields: ["admission_type_id", "discharge_disposition_id", "admission_source_id", "time_in_hospital"],
  },
  {
    title: "Utilization",
    fields: ["num_lab_procedures", "num_procedures", "num_medications", "number_outpatient", "number_emergency", "number_inpatient", "number_diagnoses"],
  },
  {
    title: "Diagnoses & labs",
    fields: ["diag_1", "diag_2", "diag_3", "max_glu_serum", "A1Cresult"],
  },
];

export default function PatientDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get(`/patients/${id}`), api.get(`/predictions/history/${id}`)])
      .then(([p, h]) => {
        setPatient(p.data);
        setHistory(h.data);
      })
      .catch(() => setError("Unable to load this patient — it may be outside your assigned scope."))
      .finally(() => setLoading(false));
  }, [id]);

  const canReassess = user?.role === "doctor" || user?.role === "system_admin";

  if (loading) {
    return (
      <DashboardLayout title="Patient profile">
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--line-soft)" }} />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Patient profile">
        <Card className="text-center py-16">
          <p className="font-display text-lg" style={{ color: "var(--ink)" }}>{error}</p>
          <Link to="/patients" className="text-sm font-semibold mt-3 inline-block" style={{ color: "var(--primary)" }}>
            ← Back to patients
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  const cf = patient.clinical_features || {};

  return (
    <DashboardLayout title={patient.full_name} subtitle={`MRN ${patient.mrn} · Admitted ${formatDate(patient.admitted_at)}`}>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Risk summary */}
        <Card className="flex flex-col items-center text-center gap-4">
          {patient.latest_risk ? (
            <>
              <RiskDial probability={patient.latest_risk.readmission_probability} category={patient.latest_risk.risk_category} />
              <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                Last assessed {formatDate(patient.latest_risk.created_at)}
              </p>
            </>
          ) : (
            <div className="py-10">
              <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No risk assessment on file yet.</p>
            </div>
          )}
          {canReassess && (
            <button
              onClick={() => navigate(`/predict?patientId=${patient.id}`)}
              className="w-full py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              {patient.latest_risk ? "Re-run assessment" : "Run risk assessment"}
            </button>
          )}
        </Card>

        {/* Recommendations */}
        <Card className="lg:col-span-2">
          <h3 className="font-display text-base font-semibold mb-1" style={{ color: "var(--ink)" }}>
            Care recommendations
          </h3>
          <p className="text-xs mb-4" style={{ color: "var(--ink-soft)" }}>
            Generated from the most recent risk assessment
          </p>
          {patient.latest_risk?.recommendations?.length ? (
            <ul className="space-y-2.5">
              {patient.latest_risk.recommendations.map((r, i) => (
                <li key={i} className="flex gap-2.5 text-sm" style={{ color: "var(--ink)" }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--primary)" }} />
                  {r}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>Run an assessment to generate recommendations.</p>
          )}
        </Card>
      </div>

      {/* Clinical profile */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {FEATURE_GROUPS.map((group) => (
          <Card key={group.title}>
            <h3 className="font-display text-base font-semibold mb-3" style={{ color: "var(--ink)" }}>{group.title}</h3>
            <dl className="space-y-2">
              {group.fields.map((f) => (
                <div key={f} className="flex items-center justify-between text-sm">
                  <dt style={{ color: "var(--ink-soft)" }}>{fieldLabel(f)}</dt>
                  <dd className="font-mono font-medium" style={{ color: "var(--ink)" }}>{String(cf[f] ?? "—")}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>

      {/* History */}
      <Card className="mt-6">
        <h3 className="font-display text-base font-semibold mb-4" style={{ color: "var(--ink)" }}>Assessment history</h3>
        {history.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>No prior assessments.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: "var(--paper)" }}>
                <div className="flex items-center gap-3">
                  <RiskBadge category={h.risk_category} size="sm" />
                  <span className="font-mono text-sm" style={{ color: "var(--ink)" }}>{formatPercent(h.readmission_probability)}</span>
                </div>
                <span className="text-xs" style={{ color: "var(--ink-soft)" }}>{formatDate(h.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DashboardLayout>
  );
}

function fieldLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\bid\b/i, "ID")
    .replace(/^./, (c) => c.toUpperCase());
}
