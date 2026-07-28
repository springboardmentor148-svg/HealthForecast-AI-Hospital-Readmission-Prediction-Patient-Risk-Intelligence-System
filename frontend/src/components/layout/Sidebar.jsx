import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABELS } from "../../lib/format";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: IconGrid, roles: ["doctor", "hospital_administrator", "healthcare_researcher", "system_admin"] },
  { to: "/patients", label: "Patients", icon: IconUsers, roles: ["doctor", "hospital_administrator", "healthcare_researcher", "system_admin"] },
  { to: "/predict", label: "Risk Prediction", icon: IconPulse, roles: ["doctor", "hospital_administrator", "system_admin"] },
  { to: "/analytics", label: "Analytics", icon: IconChart, roles: ["doctor", "hospital_administrator", "healthcare_researcher", "system_admin"] },
  { to: "/admin/users", label: "User Management", icon: IconShield, roles: ["system_admin"] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user?.role));

  return (
    <aside
      className="hidden md:flex md:flex-col md:w-64 shrink-0 border-r"
      style={{ borderColor: "var(--line)", background: "var(--paper-raised)" }}
    >
      <div className="px-5 py-6 flex items-center gap-2.5">
        <svg width="26" height="26" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="7" fill="var(--primary)" />
          <path
            d="M4 17h5l2.5-7 4 14 3-11 2 4h7.5"
            stroke="#F7F9FA" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
        <div className="leading-tight">
          <p className="font-display font-semibold text-[15px]" style={{ color: "var(--ink)" }}>
            HealthForecast
          </p>
          <p className="text-[10px] tracking-[0.14em] uppercase font-mono" style={{ color: "var(--ink-soft)" }}>
            Patient Risk Intelligence
          </p>
        </div>
      </div>

      <div className="hairline mx-5" />

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "" : "hover:bg-[var(--line-soft)]"
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? "var(--primary-ink)" : "var(--ink-soft)",
              background: isActive ? "var(--primary-soft)" : "transparent",
            })}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="hairline mx-5" />

      <div className="p-4">
        <div className="flex items-center gap-3 px-1 py-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-semibold shrink-0"
            style={{ background: "var(--primary-soft)", color: "var(--primary-ink)" }}
          >
            {(user?.full_name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>{user?.full_name}</p>
            <p className="text-[11px] truncate" style={{ color: "var(--ink-soft)" }}>{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--line-soft)]"
          style={{ color: "var(--ink-soft)" }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

function IconGrid() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.2" /><path d="M2.5 20c1-3.6 3.6-5.5 6.5-5.5s5.5 1.9 6.5 5.5" />
      <circle cx="17.5" cy="8.5" r="2.6" /><path d="M15.5 14.6c2.3.2 4.2 1.9 5 4.4" />
    </svg>
  );
}
function IconPulse() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12h4l2-6 4 12 3-9 2 3h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20V10M11 20V4M18 20v-7" strokeLinecap="round" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinejoin="round" />
    </svg>
  );
}
