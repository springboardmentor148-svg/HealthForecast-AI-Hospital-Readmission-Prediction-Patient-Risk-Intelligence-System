import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Card, SectionLabel } from "../components/ui";
import { api } from "../api";

export default function Settings() {
  const { theme: C } = useTheme();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | done | error
  const [error, setError] = useState("");

  const inputStyle = {
    width: "100%", marginTop: 5, padding: "9px 11px", borderRadius: 7,
    border: `1px solid ${C.border}`, fontFamily: C.sans, fontSize: 13.5,
    color: C.ink, background: C.surface, boxSizing: "border-box", outline: "none",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setStatus("saving");
    try {
      await api.changePassword(currentPassword, newPassword);
      setStatus("done");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  };

  return (
    <div>
      <h1 style={{ fontFamily: C.serif, fontSize: 26, color: C.ink, margin: 0, fontWeight: 600 }}>Settings</h1>
      <p style={{ fontFamily: C.sans, color: C.inkMuted, fontSize: 13.5, marginTop: 6, marginBottom: 22 }}>
        Account details and security.
      </p>

      <Card style={{ marginBottom: 14, maxWidth: 420 }}>
        <SectionLabel>Account</SectionLabel>
        <div style={{ fontFamily: C.sans, fontSize: 13.5, color: C.ink, marginTop: 8 }}>{user?.full_name || "—"}</div>
        <div style={{ fontFamily: C.mono, fontSize: 12.5, color: C.inkMuted, marginTop: 3 }}>{user?.email}</div>
        <div style={{
          display: "inline-block", marginTop: 10, fontFamily: C.mono, fontSize: 10.5, fontWeight: 600,
          color: C.tealDark, background: C.tealPale, padding: "3px 9px", borderRadius: 999, letterSpacing: 0.3,
          textTransform: "uppercase",
        }}>
          {user?.role}
        </div>
      </Card>

      <Card style={{ maxWidth: 420 }}>
        <SectionLabel>Change password</SectionLabel>
        <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
          <label style={{ fontFamily: C.sans, fontSize: 11.5, color: C.inkMuted, fontWeight: 500 }}>Current password</label>
          <input
            type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
            style={inputStyle}
          />
          <label style={{ fontFamily: C.sans, fontSize: 11.5, color: C.inkMuted, fontWeight: 500, marginTop: 14, display: "block" }}>New password</label>
          <input
            type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle} placeholder="At least 8 characters"
          />

          {status === "error" && (
            <div style={{ marginTop: 12, fontFamily: C.sans, fontSize: 12, color: C.high, background: C.highPale, padding: "8px 10px", borderRadius: 6 }}>
              {error}
            </div>
          )}
          {status === "done" && (
            <div style={{ marginTop: 12, fontFamily: C.sans, fontSize: 12, color: C.low, background: C.lowPale, padding: "8px 10px", borderRadius: 6 }}>
              Password updated.
            </div>
          )}

          <button
            type="submit" disabled={status === "saving"}
            style={{
              marginTop: 16, background: C.teal, color: "#fff", border: "none", borderRadius: 7,
              padding: "10px 18px", fontFamily: C.sans, fontSize: 13.5, fontWeight: 600,
              cursor: status === "saving" ? "default" : "pointer", opacity: status === "saving" ? 0.7 : 1,
            }}
          >
            {status === "saving" ? "Saving…" : "Update password"}
          </button>
        </form>
      </Card>
    </div>
  );
}
