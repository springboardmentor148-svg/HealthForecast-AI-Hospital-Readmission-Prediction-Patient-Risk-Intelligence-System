import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, AlertTriangle, CheckCircle2, Activity, TrendingUp, ChevronRight, Info } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { Card, SectionLabel, RiskBadge, AnimatedNumber, Pulse } from "../components/ui";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { theme: C } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .myPredictions()
      .then(setHistory)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const highRisk = history.filter((h) => h.risk_band === "High");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: C.serif, fontSize: 26, color: C.ink, margin: 0, fontWeight: 600 }}>
            Welcome back{user?.full_name ? `, ${user.full_name}` : ""}
          </h1>
          <p style={{ fontFamily: C.sans, color: C.inkMuted, fontSize: 13.5, marginTop: 6 }}>
            Model coverage and your recently scored encounters.
          </p>
        </div>
        <Pulse />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { icon: Users, label: "Encounters you've scored", value: history.length, sub: "this account" },
          { icon: AlertTriangle, label: "Flagged high-risk", value: highRisk.length, sub: "of your scored encounters" },
          { icon: CheckCircle2, label: "Model accuracy", value: 80, suffix: "%", sub: "inflated by 91% majority class" },
          { icon: Activity, label: "Model ROC-AUC", value: 0.65, decimals: 2, sub: "vs. 0.50 random" },
          { icon: TrendingUp, label: "Recall on true readmits", value: 39, suffix: "%", sub: "at 17% precision" },
        ].map((k, i) => (
          <Card key={i} delay={i * 0.06}>
            <k.icon size={17} color={C.teal} strokeWidth={1.8} />
            <div style={{ fontFamily: C.mono, fontSize: 26, color: C.ink, marginTop: 10, fontWeight: 600 }}>
              <AnimatedNumber value={k.value} decimals={k.decimals || 0} suffix={k.suffix || ""} />
            </div>
            <div style={{ fontFamily: C.sans, fontSize: 12.5, color: C.inkMuted, marginTop: 2 }}>{k.label}</div>
            <div style={{ fontFamily: C.sans, fontSize: 11, color: C.inkFaint, marginTop: 4 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <Card style={{ padding: 0 }} delay={0.15}>
          <div style={{ padding: "18px 20px 4px" }}>
            <SectionLabel>Your recent encounters</SectionLabel>
          </div>

          {loading && (
            <div style={{ padding: 24, fontFamily: C.sans, fontSize: 13, color: C.inkMuted }}>Loading…</div>
          )}
          {error && (
            <div style={{ padding: "12px 20px", fontFamily: C.sans, fontSize: 12, color: C.high, background: C.highPale, margin: "0 20px 16px", borderRadius: 6 }}>
              {error}
            </div>
          )}
          {!loading && !error && history.length === 0 && (
            <div style={{ padding: "24px 20px", fontFamily: C.sans, fontSize: 13, color: C.inkMuted }}>
              No encounters scored yet.{" "}
              <span style={{ color: C.teal, fontWeight: 600, cursor: "pointer" }} onClick={() => navigate("/predict")}>
                Score your first one →
              </span>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.sans, fontSize: 13 }}>
              <thead>
                <tr style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                  {["Scored at", "Primary dx", "Stay (days)", "Admission", "Risk score", ""].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 20px", color: C.inkFaint, fontWeight: 500, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                    style={{ borderBottom: `1px solid ${C.border}` }}
                  >
                    <td style={{ padding: "12px 20px", fontFamily: C.mono, color: C.ink, fontSize: 12 }}>
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 20px", color: C.inkMuted }}>{p.input_payload?.primary_diagnosis}</td>
                    <td style={{ padding: "12px 20px", color: C.inkMuted, fontFamily: C.mono }}>{p.input_payload?.time_in_hospital}</td>
                    <td style={{ padding: "12px 20px", color: C.inkMuted }}>{p.input_payload?.admission_grouped}</td>
                    <td style={{ padding: "12px 20px", fontFamily: C.mono, color: C.ink }}>{(p.probability * 100).toFixed(0)}%</td>
                    <td style={{ padding: "12px 20px" }}><RiskBadge score={p.probability} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card style={{ cursor: "pointer" }}>
            <div onClick={() => navigate("/predict")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: C.sans, fontWeight: 600, fontSize: 14, color: C.ink }}>Score a patient</div>
                <div style={{ fontFamily: C.sans, fontSize: 12, color: C.inkMuted, marginTop: 3 }}>Enter encounter details for a risk estimate</div>
              </div>
              <ChevronRight size={16} color={C.teal} />
            </div>
          </Card>
          <Card style={{ cursor: "pointer" }}>
            <div onClick={() => navigate("/analytics")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: C.sans, fontWeight: 600, fontSize: 14, color: C.ink }}>Model performance</div>
                <div style={{ fontFamily: C.sans, fontSize: 12, color: C.inkMuted, marginTop: 3 }}>ROC / PR curves, thresholds, drivers</div>
              </div>
              <ChevronRight size={16} color={C.teal} />
            </div>
          </Card>
          <Card style={{ background: C.tealPale, border: `1px solid ${C.teal}22` }}>
            <div style={{ display: "flex", gap: 8 }}>
              <Info size={15} color={C.tealDark} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontFamily: C.sans, fontSize: 12, color: C.tealDark, lineHeight: 1.5 }}>
                Base rate of 30-day readmission in this cohort is ~9%. Scores are a triage aid, not a diagnosis.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
