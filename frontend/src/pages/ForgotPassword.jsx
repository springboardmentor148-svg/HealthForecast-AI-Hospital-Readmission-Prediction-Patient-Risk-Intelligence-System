import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList, Info } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { BackgroundFX, ThemeToggle } from "../components/ui";
import { api } from "../api";

export default function ForgotPassword() {
  const { theme: C } = useTheme();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    width: "100%", marginTop: 5, padding: "9px 11px", borderRadius: 7,
    border: `1px solid ${C.border}`, fontFamily: C.sans, fontSize: 13.5,
    color: C.ink, background: C.surface, boxSizing: "border-box", outline: "none",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setResetToken(res.reset_token || null);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: C.sans }}>
      <BackgroundFX />
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 2 }}>
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: "relative", zIndex: 1, width: 400, background: C.surface,
          border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, boxShadow: C.shadowMd,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 26 }}>
          <ClipboardList size={20} color={C.teal} />
          <div style={{ fontFamily: C.serif, fontSize: 16, fontWeight: 600, color: C.ink }}>DRIS</div>
        </div>

        <h1 style={{ fontFamily: C.serif, fontSize: 21, color: C.ink, margin: "0 0 4px", fontWeight: 600 }}>Reset your password</h1>
        <p style={{ fontFamily: C.sans, fontSize: 13, color: C.inkMuted, margin: "0 0 22px" }}>
          Enter your account email to get a reset link.
        </p>

        {!resetToken ? (
          <form onSubmit={handleSubmit}>
            <label style={{ fontFamily: C.sans, fontSize: 11.5, color: C.inkMuted, fontWeight: 500 }}>Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              style={inputStyle} placeholder="you@hospital.org"
            />

            {error && (
              <div style={{ marginTop: 12, fontFamily: C.sans, fontSize: 12, color: C.high, background: C.highPale, padding: "8px 10px", borderRadius: 6 }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                marginTop: 20, width: "100%", background: C.teal, color: "#fff", border: "none",
                borderRadius: 7, padding: "11px 0", fontFamily: C.sans, fontSize: 13.5, fontWeight: 600,
                cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        ) : resetToken === "" ? (
          <div style={{ fontFamily: C.sans, fontSize: 13, color: C.ink, lineHeight: 1.6 }}>
            If an account exists for that email, a reset link has been generated.
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", gap: 8, background: C.tealPale, padding: "10px 12px", borderRadius: 8, marginBottom: 14 }}>
              <Info size={14} color={C.tealDark} style={{ marginTop: 2, flexShrink: 0 }} />
              <div style={{ fontFamily: C.sans, fontSize: 11.5, color: C.tealDark, lineHeight: 1.5 }}>
                No email service is configured for this project, so the reset
                link is shown here directly rather than emailed — in a real
                deployment this would arrive in your inbox instead.
              </div>
            </div>
            <Link
              to={`/reset-password?token=${encodeURIComponent(resetToken)}`}
              style={{
                display: "block", textAlign: "center", background: C.teal, color: "#fff",
                borderRadius: 7, padding: "11px 0", fontFamily: C.sans, fontSize: 13.5,
                fontWeight: 600, textDecoration: "none",
              }}
            >
              Continue to reset password →
            </Link>
          </div>
        )}

        <div style={{ marginTop: 18, textAlign: "center", fontFamily: C.sans, fontSize: 12.5, color: C.inkMuted }}>
          <Link to="/login" style={{ color: C.teal, fontWeight: 600, textDecoration: "none" }}>Back to sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
