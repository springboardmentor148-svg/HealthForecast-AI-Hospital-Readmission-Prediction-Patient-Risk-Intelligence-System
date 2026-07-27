import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { BackgroundFX, ThemeToggle } from "../components/ui";

export default function Register() {
  const { theme: C } = useTheme();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, fullName);
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed.");
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
          <div>
            <div style={{ fontFamily: C.serif, fontSize: 16, fontWeight: 600, color: C.ink, lineHeight: 1.1 }}>DRIS</div>
            <div style={{ fontFamily: C.mono, fontSize: 9.5, color: C.inkFaint, letterSpacing: 0.5 }}>DIABETES READMISSION AI</div>
          </div>
        </div>

        <h1 style={{ fontFamily: C.serif, fontSize: 21, color: C.ink, margin: "0 0 4px", fontWeight: 600 }}>Create an account</h1>
        <p style={{ fontFamily: C.sans, fontSize: 13, color: C.inkMuted, margin: "0 0 22px" }}>
          Sign up to start scoring encounters.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ fontFamily: C.sans, fontSize: 11.5, color: C.inkMuted, fontWeight: 500 }}>Full name</label>
          <input
            type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            style={inputStyle} placeholder="Dr. Jane Smith"
          />

          <label style={{ fontFamily: C.sans, fontSize: 11.5, color: C.inkMuted, fontWeight: 500, marginTop: 14, display: "block" }}>Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            style={inputStyle} placeholder="you@hospital.org"
          />

          <label style={{ fontFamily: C.sans, fontSize: 11.5, color: C.inkMuted, fontWeight: 500, marginTop: 14, display: "block" }}>Password</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div style={{ marginTop: 18, textAlign: "center", fontFamily: C.sans, fontSize: 12.5, color: C.inkMuted }}>
          Already have an account? <Link to="/login" style={{ color: C.teal, fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
