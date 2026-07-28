import { useState } from "react";
import {
  FaHeartPulse,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRightLong,
} from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLE_DEMO_USERS, getRoleHome } from "../auth/roleConfig.js";
import "../styles/LoginPage.css";

const ROLE_OPTIONS = [
  "Doctor",
  "Hospital Administrator",
  "Healthcare Researcher",
  "System Administrator",
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState("Doctor");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: true,
  });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please enter email and password.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const sessionUser = {
      ...ROLE_DEMO_USERS[role],
      email: formData.email,
    };

    setTimeout(() => {
      login(sessionUser);
      navigate(getRoleHome(role));
    }, 500);
  };

  return (
    <main className="auth-screen">
      {/* LEFT — SIGNAL PANEL */}
      <section className="signal-panel">
        <div className="signal-brand">
          <span className="signal-mark">
            <FaHeartPulse />
          </span>
          <div className="signal-brand-text">
            <strong>HealthForecastAI</strong>
            <small>Clinical Decision Support</small>
          </div>
        </div>

        <div className="signal-hero">
          <span className="signal-eyebrow">Readmission Risk Engine</span>
          <h1>
            Know who's coming back
            <br />
            before they do.
          </h1>
          <p>
            HealthForecastAI scores every discharge in real time, flagging
            high-risk patients so your care team can act inside the window
            that matters.
          </p>

          <div className="signal-stats">
            <div className="signal-stat">
              <strong>42%</strong>
              <span>fewer readmissions</span>
            </div>
            <div className="signal-stat">
              <strong>90-day</strong>
              <span>risk window</span>
            </div>
            <div className="signal-stat">
              <strong>Real-time</strong>
              <span>EHR sync</span>
            </div>
          </div>
        </div>

        <div className="signal-trace" aria-hidden="true">
          <div className="trace-label">
            <span className="trace-dot"></span>
            Live risk signal
          </div>
          <svg viewBox="0 0 600 60" preserveAspectRatio="none" className="trace-svg">
            <path
              className="trace-line trace-line--ghost"
              d="M0,40 L60,40 L80,15 L100,50 L120,40 L600,40"
            />
            <path
              className="trace-line trace-line--active"
              d="M0,40 L60,40 L80,15 L100,50 L120,40 L600,40"
            />
          </svg>
        </div>
      </section>

      {/* RIGHT — ACCESS PANEL */}
      <section className="access-panel">
        <div className="access-card">
          <div className="access-head">
            <span className="access-kicker">Care Team Access</span>
            <h2>Sign in</h2>
          </div>

          <div className="role-toggle" role="tablist" aria-label="Sign in as">
            {ROLE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={role === option}
                className={role === option ? "role-option is-active" : "role-option"}
                onClick={() => setRole(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <form className="access-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="access-error" role="alert">
                {error}
              </div>
            )}

            <label className="access-field">
              <span>Email address</span>
              <div className="field-shell">
                <FaEnvelope className="field-icon" />
                <input
                  type="email"
                  placeholder="you@hospital.org"
                  value={formData.email}
                  autoComplete="email"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </label>

            <label className="access-field">
              <span>Password</span>
              <div className="field-shell">
                <FaLock className="field-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={formData.password}
                  autoComplete="current-password"
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="field-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </label>

            <div className="access-row">
              <label className="access-remember">
                <input
                  type="checkbox"
                  checked={formData.remember}
                  onChange={(e) =>
                    setFormData({ ...formData, remember: e.target.checked })
                  }
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="access-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="access-submit" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Sign in"}
              <FaArrowRightLong />
            </button>
          </form>

          <p className="access-footer">
            New to this workspace?{" "}
            <Link to="/register" className="access-link">
              Create an account
            </Link>
          </p>

          <p className="access-trust">Encrypted access · Enterprise-grade security</p>
        </div>
      </section>
    </main>
  );
}