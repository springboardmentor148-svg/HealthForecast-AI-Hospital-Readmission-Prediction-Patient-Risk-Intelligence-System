import React from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Stethoscope, BarChart3, Info as InfoIcon, ClipboardList,
  LogOut, History as HistoryIcon, Settings as SettingsIcon
} from "lucide-react";
import { useTheme } from "./context/ThemeContext";
import { BackgroundFX, ThemeToggle } from "./components/ui";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import Predict from "./pages/Predict";
import Analytics from "./pages/Analytics";
import History from "./pages/History";
import Settings from "./pages/Settings";

function AppLayout() {
  const { theme: C } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const nav = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/predict", label: "Predict risk", icon: Stethoscope },
    { path: "/history", label: "History", icon: HistoryIcon },
    { path: "/analytics", label: "Model analytics", icon: BarChart3 },
    { path: "/about", label: "About", icon: InfoIcon },
  ];

  return (
    <div style={{ position: "relative", display: "flex", minHeight: "100vh", background: C.bg, fontFamily: C.sans }}>
      <BackgroundFX />

      <aside style={{ position: "relative", zIndex: 1, width: 220, background: C.surface, borderRight: `1px solid ${C.border}`, padding: "22px 16px", flexShrink: 0, boxShadow: C.shadowSm, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 30, padding: "0 6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ClipboardList size={18} color={C.teal} />
            <div>
              <div style={{ fontFamily: C.serif, fontSize: 14.5, fontWeight: 600, color: C.ink, lineHeight: 1.1 }}>DRIS</div>
              <div style={{ fontFamily: C.mono, fontSize: 9.5, color: C.inkFaint, letterSpacing: 0.5 }}>DIABETES READMISSION AI</div>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {nav.map((n) => {
          const active = location.pathname === n.path;
          return (
            <motion.div
              key={n.path}
              onClick={() => navigate(n.path)}
              whileHover={{ x: 2 }}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 7,
                cursor: "pointer", marginBottom: 3, transition: "background 0.2s, color 0.2s",
                background: active ? C.tealPale : "transparent",
                color: active ? C.tealDark : C.inkMuted,
              }}
            >
              <n.icon size={15} strokeWidth={1.8} />
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{n.label}</span>
            </motion.div>
          );
        })}

        <div style={{ marginTop: 30, padding: 12, background: C.surfaceAlt, borderRadius: 8 }}>
          <div style={{ fontFamily: C.mono, fontSize: 10.5, color: C.inkFaint, letterSpacing: 0.4, marginBottom: 4 }}>MODEL</div>
          <div style={{ fontFamily: C.sans, fontSize: 12, color: C.ink }}>XGBoost, tuned</div>
          <div style={{ fontFamily: C.mono, fontSize: 11, color: C.inkMuted, marginTop: 2 }}>ROC-AUC 0.649</div>
        </div>

        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <div
            onClick={() => navigate("/settings")}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 6px", borderRadius: 7, cursor: "pointer", marginBottom: 4 }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: C.sans, fontSize: 12.5, color: C.ink, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.full_name || user?.email}
              </div>
              {user?.role === "admin" && (
                <div style={{
                  display: "inline-block", marginTop: 3, fontFamily: C.mono, fontSize: 9,
                  fontWeight: 700, color: C.tealDark, background: C.tealPale, padding: "2px 7px",
                  borderRadius: 999, letterSpacing: 0.4,
                }}>
                  ADMIN
                </div>
              )}
            </div>
            <SettingsIcon size={14} color={C.inkFaint} />
          </div>
          <motion.div
            onClick={logout}
            whileHover={{ x: 2 }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 6px", borderRadius: 7, cursor: "pointer", color: C.inkMuted, fontSize: 13 }}
          >
            <LogOut size={14} /> Sign out
          </motion.div>
        </div>
      </aside>

      <main style={{ position: "relative", zIndex: 1, flex: 1, padding: "28px 34px", maxWidth: 1180 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Routes location={location}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/predict" element={<Predict />} />
              <Route path="/history" element={<History />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/about" element={<About />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
