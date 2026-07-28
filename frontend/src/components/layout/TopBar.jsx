import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function TopBar({ title, subtitle }) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <header
      className="sticky top-0 z-20 border-b backdrop-blur"
      style={{ borderColor: "var(--line)", background: "rgba(247,249,250,0.9)" }}
    >
      <div className="flex items-center justify-between px-5 md:px-8 py-4">
        <div>
          <h1 className="font-display text-xl md:text-2xl font-semibold" style={{ color: "var(--ink)" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: "var(--ink-soft)" }}>
              {subtitle}
            </p>
          )}
        </div>
        <button
          className="md:hidden p-2 rounded-lg"
          style={{ background: "var(--paper-raised)", border: "1px solid var(--line)" }}
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden px-5 pb-4 flex flex-col gap-1">
          {[
            ["/", "Overview"], ["/patients", "Patients"], ["/predict", "Risk Prediction"],
            ["/analytics", "Analytics"], ["/admin/users", "User Management"],
          ].map(([to, label]) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className="px-2 py-2 text-sm rounded-lg" style={{ color: "var(--ink)" }}>
              {label}
            </NavLink>
          ))}
          <button onClick={logout} className="text-left px-2 py-2 text-sm rounded-lg" style={{ color: "var(--ink-soft)" }}>
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
