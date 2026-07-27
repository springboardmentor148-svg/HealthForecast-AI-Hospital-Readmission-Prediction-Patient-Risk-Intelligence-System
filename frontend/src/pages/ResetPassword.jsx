import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { BackgroundFX, ThemeToggle } from "../components/ui";
import { api } from "../api";

export default function ResetPassword() {
  const { theme: C } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [done, setDone] = useState(false);
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
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.message || "Reset failed — the link may have expired.");
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
          position: "relative", zIndex: 1, width: 380, background: C.surface,
          border: `1px solid ${C.border}`, borderRadius: 14, padding: 32, boxShadow: C.shadowMd,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 26 }}>
          <ClipboardList size={20} color={C.teal} />
          <div style={{ fontFamily: C.serif, fontSize: 16, fontWeight: 600, color: C.ink }}>DRIS</div>
        </div>

        {!token ? (
          <div style={{ fontFamily: C.sans, fontSize: 13, color: C.high }}>
            No reset token found in the URL. Use the link from the "Forgot password" step.
          </div>
        ) : done ? (
          <div>
            <h1 style={{ fontFamily: C.serif, fontSize: 21, color: C.ink, margin: "0 0 10px", fontWeight: 600 }}>Password updated</h1>
            <p style={{ fontFamily: C.sans, fontSize: 13, color: C.inkMuted, marginBottom: 20 }}>
              You can sign in with your new password now.
            </p>
            <button
              onClick={() => navigate("/login")}
              style={{
                width: "100%", background: C.teal, color: "#fff", border: "none",
                borderRadius: 7, padding: "11px 0", fontFamily: C.sans, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              }}
            >
              Go to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1 style={{ fontFamily: C.serif, fontSize: 21, color: C.ink, margin: "0 0 4px", fontWeight: 600 }}>Set a new password</h1>
            <p style={{ fontFamily: C.sans, fontSize: 13, color: C.inkMuted, margin: "0 0 22px" }}>
              This link expires 30 minutes after it was requested.
            </p>

            <label style={{ fontFamily: C.sans, fontSize: 11.5, color: C.inkMuted, fontWeight: 500 }}>New password</label>
            <input
              type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle} placeholder="At least 8 characters"
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
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        <div style={{ marginTop: 18, textAlign: "center", fontFamily: C.sans, fontSize: 12.5, color: C.inkMuted }}>
          <Link to="/login" style={{ color: C.teal, fontWeight: 600, textDecoration: "none" }}>Back to sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
