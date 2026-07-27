import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const { theme: C } = useTheme();

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", fontFamily: C.sans, color: C.inkMuted, fontSize: 14, background: C.bg,
      }}>
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
