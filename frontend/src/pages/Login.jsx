import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEMO_ACCOUNTS = [
  { role: "Doctor", username: "dr.patel", password: "Doctor@123" },
  { role: "Hospital Administrator", username: "hospitaladmin", password: "Admin@123" },
  { role: "Healthcare Researcher", username: "researcher", password: "Research@123" },
  { role: "System Administrator", username: "admin", password: "Admin@123" },
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      const dest = location.state?.from?.pathname || "/";
      navigate(dest, { replace: true });
    } catch {
      setError("Incorrect username or password.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(acc) {
    setUsername(acc.username);
    setPassword(acc.password);
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2" style={{ background: "var(--paper)" }}>
      {/* Left: brand / clinical vitals-strip signature */}
      <div
        className="hidden md:flex flex-col justify-between p-12"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
      >
        <div className="flex items-center gap-3">
          <svg width="30" height="30" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="7" fill="var(--primary)" />
            <path d="M4 17h5l2.5-7 4 14 3-11 2 4h7.5" stroke="#F7F9FA" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display text-lg font-semibold">HealthForecast AI</span>
        </div>

        <div>
          <p className="font-mono text-xs tracking-[0.2em] uppercase mb-4" style={{ color: "#8FA3B0" }}>
            Patient risk intelligence, in real time
          </p>
          <h2 className="font-display text-4xl leading-[1.15] font-medium max-w-md">
            One dashboard to see who is likely to come back — before they do.
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t pt-6" style={{ borderColor: "#28425080" }}>
          {[
            ["43", "clinical signals per read"],
            ["AUC 0.68", "model discrimination"],
            ["<200ms", "prediction latency"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="font-mono text-xl font-semibold">{value}</p>
              <p className="text-xs mt-1" style={{ color: "#8FA3B0" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold" style={{ color: "var(--ink)" }}>
            Sign in
          </h1>
          <p className="text-sm mt-1.5 mb-8" style={{ color: "var(--ink-soft)" }}>
            Access the hospital readmission &amp; patient risk platform.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--ink-soft)" }}>
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--line)", background: "var(--paper-raised)" }}
                placeholder="dr.patel"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--ink-soft)" }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--line)", background: "var(--paper-raised)" }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ background: "var(--risk-critical-soft)", color: "var(--risk-critical)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{ background: "var(--primary)", color: "#fff" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--line)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--ink-soft)" }}>
              Demo accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="text-left px-3 py-2 rounded-lg border text-xs transition-colors hover:bg-[var(--line-soft)]"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span className="block font-semibold" style={{ color: "var(--ink)" }}>{acc.role}</span>
                  <span className="font-mono" style={{ color: "var(--ink-soft)" }}>{acc.username}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
