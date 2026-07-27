import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Card, SectionLabel } from "../components/ui";

export default function About() {
  const { theme: C } = useTheme();
  return (
    <div>
      <h1 style={{ fontFamily: C.serif, fontSize: 26, color: C.ink, margin: 0, fontWeight: 600 }}>About DRIS</h1>
      <p style={{ fontFamily: C.sans, color: C.inkMuted, fontSize: 13.5, marginTop: 6, marginBottom: 22 }}>
        DRIS — the Diabetes Readmission Intelligent System. What it does, what it's built on, and its honest limits.
      </p>

      <Card style={{ marginBottom: 14 }}>
        <SectionLabel>What it does</SectionLabel>
        <p style={{ fontFamily: C.sans, fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: 0 }}>
          DRIS estimates a patient's probability of hospital readmission
          within 30 days of discharge, based on encounter-level clinical data —
          diagnosis, length of stay, prior utilization, discharge disposition, and
          related factors. It's a triage aid intended to help prioritize follow-up
          outreach, not a diagnostic tool and not a substitute for clinical judgment.
        </p>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SectionLabel>The model</SectionLabel>
        <p style={{ fontFamily: C.sans, fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: "0 0 10px" }}>
          A gradient-boosted tree model (XGBoost), trained and hyperparameter-tuned
          on the UCI "Diabetes 130-US hospitals" dataset (~70,000 encounters,
          1999–2008). Evaluated on a held-out 20% test split.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginTop: 12 }}>
          {[
            ["ROC-AUC", "0.649"],
            ["PR-AUC", "0.163"],
            ["Recall (readmitted)", "39%"],
            ["Precision (readmitted)", "17%"],
          ].map(([label, value]) => (
            <div key={label} style={{ background: C.surfaceAlt, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontFamily: C.mono, fontSize: 18, color: C.teal, fontWeight: 600 }}>{value}</div>
              <div style={{ fontFamily: C.sans, fontSize: 11.5, color: C.inkMuted, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SectionLabel>Honest limitations</SectionLabel>
        <ul style={{ fontFamily: C.sans, fontSize: 13.5, color: C.ink, lineHeight: 1.7, margin: 0, paddingLeft: 18 }}>
          <li>Only ~9% of encounters in the training data are readmitted within 30 days, so precision at any usable recall level is modest — most flagged patients will not actually be readmitted.</li>
          <li>The training data is from 1999–2008 US hospitals and may not reflect current patient populations or care practices.</li>
          <li>The model was not evaluated for fairness or bias across demographic subgroups; that analysis would be a prerequisite for any real clinical use.</li>
          <li>Ensemble methods (blending, stacking with Random Forest) were tested and did not produce a repeatable improvement over the single tuned XGBoost model, so the simpler model was kept.</li>
        </ul>
      </Card>

      <Card>
        <SectionLabel>Stack</SectionLabel>
        <p style={{ fontFamily: C.sans, fontSize: 13.5, color: C.ink, lineHeight: 1.6, margin: 0 }}>
          FastAPI (model serving), PostgreSQL (accounts + prediction history),
          React + Vite (interface), scikit-learn / XGBoost (model training).
        </p>
      </Card>
    </div>
  );
}
