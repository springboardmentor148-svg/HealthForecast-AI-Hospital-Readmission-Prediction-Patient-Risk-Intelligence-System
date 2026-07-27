import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { useTheme } from "../context/ThemeContext";
import { Card, SectionLabel, AnimatedNumber } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

const featureImportance = [
  { name: "Prior inpatient visits", val: 100 },
  { name: "Number of diagnoses", val: 78 },
  { name: "Discharge disposition", val: 66 },
  { name: "Time in hospital", val: 54 },
  { name: "Primary diagnosis", val: 49 },
  { name: "Prior ER visits", val: 43 },
  { name: "Medications count", val: 34 },
  { name: "Age group", val: 27 },
];

const thresholdTradeoff = [
  { t: "0.40", precision: 12, recall: 61 },
  { t: "0.50", precision: 15, recall: 47 },
  { t: "0.56", precision: 17, recall: 39 },
  { t: "0.60", precision: 18, recall: 35 },
  { t: "0.70", precision: 24, recall: 19 },
];

export default function Analytics() {
  const { theme: C } = useTheme();
  const { user } = useAuth();
  const classSplit = [
    { name: "Not readmitted <30d", value: 91, color: C.teal },
    { name: "Readmitted <30d", value: 9, color: C.high },
  ];

  const [records, setRecords] = useState([]);
  const [loadingPatterns, setLoadingPatterns] = useState(true);

  useEffect(() => {
    const fetcher = user?.role === "admin" ? api.allPredictions({ limit: 500 }) : api.myPredictions({ limit: 500 });
    fetcher.then(setRecords).catch(() => {}).finally(() => setLoadingPatterns(false));
  }, [user]);

  // Real aggregates computed from actual scored encounters in this app —
  // not the original training dataset, not a claim about confirmed
  // outcomes (these are predicted probabilities, not verified readmissions),
  // and not causal. Small samples early on will look noisy; that's honest,
  // not a bug.
  const groupBy = (keyFn) => {
    const groups = {};
    for (const r of records) {
      const key = keyFn(r);
      if (key === undefined || key === null) continue;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r.probability);
    }
    return Object.entries(groups)
      .map(([key, probs]) => ({
        key,
        avg: probs.reduce((a, b) => a + b, 0) / probs.length,
        n: probs.length,
      }))
      .sort((a, b) => b.avg - a.avg);
  };

  const byMedChange = groupBy((r) => (r.input_payload?.change_flag === 1 ? "Medication changed" : "No medication change"));
  const byDischarge = groupBy((r) => r.input_payload?.discharge_grouped);
  const byAdmission = groupBy((r) => r.input_payload?.admission_grouped);

  return (
    <div>
      <h1 style={{ fontFamily: C.serif, fontSize: 26, color: C.ink, margin: 0, fontWeight: 600 }}>Model performance</h1>
      <p style={{ fontFamily: C.sans, color: C.inkMuted, fontSize: 13.5, marginTop: 6, marginBottom: 22 }}>
        Tuned XGBoost, evaluated on a held-out 20% test split (13,995 encounters).
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 14 }}>
        {[
          { label: "Accuracy", value: 80, suffix: "%", note: "inflated by 91% majority class" },
          { label: "ROC-AUC", value: 0.649, decimals: 3, note: "vs. 0.500 random" },
          { label: "PR-AUC", value: 0.163, decimals: 3, note: "vs. 0.090 base rate" },
        ].map((k, i) => (
          <Card key={k.label} delay={i * 0.08}>
            <div style={{ fontFamily: C.mono, fontSize: 24, color: C.teal, fontWeight: 600 }}>
              <AnimatedNumber value={k.value} decimals={k.decimals || 0} suffix={k.suffix || ""} />
            </div>
            <div style={{ fontFamily: C.sans, fontSize: 12.5, color: C.ink, marginTop: 4, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontFamily: C.sans, fontSize: 11, color: C.inkFaint, marginTop: 2 }}>{k.note}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 14, padding: 0 }}>
        <div style={{ padding: "18px 20px 4px" }}>
          <SectionLabel>Precision &amp; recall by class — at 0.56 threshold</SectionLabel>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.sans, fontSize: 13 }}>
          <thead>
            <tr style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
              {["Class", "Precision", "Recall", "F1-score", "Support"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 20px", color: C.inkFaint, fontWeight: 500, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: "12px 20px" }}>
                <span style={{ fontFamily: C.sans, fontWeight: 600, color: C.ink }}>Not readmitted &lt;30d</span>
                <span style={{ display: "block", fontFamily: C.mono, fontSize: 10.5, color: C.inkFaint, marginTop: 2 }}>majority class</span>
              </td>
              <td style={{ padding: "12px 20px", fontFamily: C.mono, color: C.ink }}>0.93</td>
              <td style={{ padding: "12px 20px", fontFamily: C.mono, color: C.ink }}>0.85</td>
              <td style={{ padding: "12px 20px", fontFamily: C.mono, color: C.ink }}>0.89</td>
              <td style={{ padding: "12px 20px", fontFamily: C.mono, color: C.inkMuted }}>12,740</td>
            </tr>
            <tr>
              <td style={{ padding: "12px 20px" }}>
                <span style={{ fontFamily: C.sans, fontWeight: 600, color: C.ink }}>Readmitted &lt;30d</span>
                <span style={{ display: "block", fontFamily: C.mono, fontSize: 10.5, color: C.inkFaint, marginTop: 2 }}>minority class — the one that matters clinically</span>
              </td>
              <td style={{ padding: "12px 20px", fontFamily: C.mono, color: C.ink }}>0.17</td>
              <td style={{ padding: "12px 20px", fontFamily: C.mono, color: C.ink }}>0.39</td>
              <td style={{ padding: "12px 20px", fontFamily: C.mono, color: C.ink }}>0.24</td>
              <td style={{ padding: "12px 20px", fontFamily: C.mono, color: C.inkMuted }}>1,255</td>
            </tr>
          </tbody>
        </table>
        <div style={{ padding: "12px 20px 18px", fontFamily: C.sans, fontSize: 11.5, color: C.inkFaint }}>
          The majority class scores high almost by default given the 91%/9% class imbalance — the minority-class row is the harder, more clinically meaningful number.
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card>
          <SectionLabel>Precision / recall by threshold</SectionLabel>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={thresholdTradeoff} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke={C.border} vertical={false} />
              <XAxis dataKey="t" tick={{ fontFamily: C.mono, fontSize: 11, fill: C.inkMuted }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fontFamily: C.mono, fontSize: 11, fill: C.inkMuted }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={{ fontFamily: C.sans, fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}` }} />
              <Legend wrapperStyle={{ fontFamily: C.sans, fontSize: 12 }} />
              <Bar dataKey="precision" fill={C.teal} name="Precision" radius={[3, 3, 0, 0]} />
              <Bar dataKey="recall" fill={C.mod} name="Recall" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionLabel>Class balance</SectionLabel>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={classSplit} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                {classSplit.map((c, i) => <Cell key={i} fill={c.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: C.sans, fontSize: 12, borderRadius: 6, border: `1px solid ${C.border}` }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: -6 }}>
            {classSplit.map((c) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: C.sans, fontSize: 11.5, color: C.inkMuted }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color, display: "inline-block" }} />
                {c.name} — {c.value}%
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionLabel>Top predictive factors</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          {featureImportance.map((f) => (
            <div key={f.name} style={{ display: "grid", gridTemplateColumns: "170px 1fr 34px", alignItems: "center", gap: 10 }}>
              <div style={{ fontFamily: C.sans, fontSize: 12.5, color: C.ink }}>{f.name}</div>
              <div style={{ height: 8, background: C.surfaceAlt, borderRadius: 4 }}>
                <div style={{ height: 8, width: `${f.val}%`, background: C.teal, borderRadius: 4 }} />
              </div>
              <div style={{ fontFamily: C.mono, fontSize: 11, color: C.inkMuted, textAlign: "right" }}>{f.val}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card style={{ marginBottom: 14 }}>
        <SectionLabel>Care pattern signals — from encounters scored in this app</SectionLabel>
        {loadingPatterns && (
          <div style={{ fontFamily: C.sans, fontSize: 12, color: C.inkMuted, marginTop: 8 }}>Loading…</div>
        )}
        {!loadingPatterns && records.length === 0 && (
          <div style={{ fontFamily: C.sans, fontSize: 12, color: C.inkMuted, marginTop: 8 }}>
            No scored encounters yet — this section fills in as encounters are scored.
          </div>
        )}
        {!loadingPatterns && records.length > 0 && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginTop: 12 }}>
              <PatternGroup title="By medication change" rows={byMedChange} C={C} />
              <PatternGroup title="By discharge disposition" rows={byDischarge} C={C} />
              <PatternGroup title="By admission source" rows={byAdmission} C={C} />
            </div>
            <div style={{ fontFamily: C.sans, fontSize: 11, color: C.inkFaint, marginTop: 14, lineHeight: 1.6 }}>
              Based on {records.length} encounter{records.length === 1 ? "" : "s"} scored in this app —
              average <em>predicted</em> risk per group, not confirmed readmission outcomes, and not
              causal (e.g. a higher average here doesn't mean the discharge type caused the risk —
              sicker patients may simply be more likely to receive that discharge type). Treat this as
              a signal worth investigating, not a conclusion, especially while sample sizes are small.
            </div>
          </>
        )}
      </Card>

    </div>
  );
}

function PatternGroup({ title, rows, C }) {
  const maxAvg = Math.max(...rows.map((r) => r.avg), 0.01);
  return (
    <div>
      <div style={{ fontFamily: C.sans, fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {rows.map((r) => (
          <div key={r.key}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: C.sans, fontSize: 11, color: C.inkMuted, marginBottom: 2 }}>
              <span>{r.key} <span style={{ color: C.inkFaint }}>(n={r.n})</span></span>
              <span style={{ fontFamily: C.mono, color: C.ink, fontWeight: 600 }}>{(r.avg * 100).toFixed(0)}%</span>
            </div>
            <div style={{ height: 5, background: C.surfaceAlt, borderRadius: 3 }}>
              <div style={{ height: 5, width: `${(r.avg / maxAvg) * 100}%`, background: C.teal, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
