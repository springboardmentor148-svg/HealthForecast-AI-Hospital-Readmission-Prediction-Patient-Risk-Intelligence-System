import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Users } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Card, SectionLabel, RiskBadge } from "../components/ui";
import { api } from "../api";

const RISK_BANDS = ["", "Low", "Moderate", "High"];

export default function History() {
  const { theme: C } = useTheme();
  const { user } = useAuth();
  const [scope, setScope] = useState("mine"); // "mine" | "all" (admin only)
  const [riskBand, setRiskBand] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = {};
    if (riskBand) params.risk_band = riskBand;
    if (diagnosis) params.diagnosis = diagnosis;
    const fetcher = scope === "all" ? api.allPredictions(params) : api.myPredictions(params);
    fetcher
      .then(setRecords)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [scope, riskBand, diagnosis]);

  useEffect(() => { load(); }, [load]);

  const isAdmin = user?.role === "admin";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: C.serif, fontSize: 26, color: C.ink, margin: 0, fontWeight: 600 }}>
            {scope === "all" ? "All scored encounters" : "Your scored encounters"}
          </h1>
          <p style={{ fontFamily: C.sans, color: C.inkMuted, fontSize: 13.5, marginTop: 6 }}>
            Search and filter previously scored patients.
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 6, background: C.surfaceAlt, padding: 4, borderRadius: 8 }}>
            {[["mine", "My encounters"], ["all", "All clinicians"]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setScope(key)}
                style={{
                  border: "none", borderRadius: 6, padding: "6px 12px", fontFamily: C.sans,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: scope === key ? C.surface : "transparent",
                  color: scope === key ? C.ink : C.inkMuted,
                  boxShadow: scope === key ? C.shadowSm : "none",
                }}
              >
                {key === "all" && <Users size={12} style={{ marginRight: 5, verticalAlign: -2 }} />}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 14, alignItems: "end" }}>
          <div>
            <div style={{ fontFamily: C.sans, fontSize: 11.5, color: C.inkMuted, marginBottom: 5, fontWeight: 500 }}>Search by diagnosis</div>
            <div style={{ position: "relative" }}>
              <Search size={14} color={C.inkFaint} style={{ position: "absolute", left: 10, top: 10 }} />
              <input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Circulatory"
                style={{
                  width: "100%", padding: "8px 10px 8px 30px", borderRadius: 6, border: `1px solid ${C.border}`,
                  fontFamily: C.sans, fontSize: 13, color: C.ink, background: C.surface, boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div>
            <div style={{ fontFamily: C.sans, fontSize: 11.5, color: C.inkMuted, marginBottom: 5, fontWeight: 500 }}>Risk band</div>
            <select
              value={riskBand}
              onChange={(e) => setRiskBand(e.target.value)}
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}`,
                fontFamily: C.sans, fontSize: 13, color: C.ink, background: C.surface,
              }}
            >
              {RISK_BANDS.map((b) => <option key={b} value={b}>{b || "All"}</option>)}
            </select>
          </div>
        </div>
      </Card>

      <Card style={{ padding: 0 }}>
        {loading && <div style={{ padding: 24, fontFamily: C.sans, fontSize: 13, color: C.inkMuted }}>Loading…</div>}
        {error && (
          <div style={{ padding: "12px 20px", fontFamily: C.sans, fontSize: 12, color: C.high, background: C.highPale, margin: 20, borderRadius: 6 }}>
            {error}
          </div>
        )}
        {!loading && !error && records.length === 0 && (
          <div style={{ padding: "24px 20px", fontFamily: C.sans, fontSize: 13, color: C.inkMuted }}>
            No encounters match these filters.
          </div>
        )}
        {!loading && !error && records.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: C.sans, fontSize: 13 }}>
            <thead>
              <tr style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                {[
                  "Scored at",
                  ...(scope === "all" ? ["Clinician"] : []),
                  "Primary dx", "Stay (days)", "Admission", "Risk score", "",
                ].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 20px", color: C.inkFaint, fontWeight: 500, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.5) }}
                  style={{ borderBottom: `1px solid ${C.border}` }}
                >
                  <td style={{ padding: "12px 20px", fontFamily: C.mono, color: C.ink, fontSize: 12 }}>
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                  {scope === "all" && (
                    <td style={{ padding: "12px 20px", color: C.inkMuted }}>{p.user_full_name || p.user_email}</td>
                  )}
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
    </div>
  );
}
