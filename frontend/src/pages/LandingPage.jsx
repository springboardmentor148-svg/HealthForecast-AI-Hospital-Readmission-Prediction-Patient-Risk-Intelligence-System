import { NavLink } from "react-router-dom";
import {
  FaBrain,
  FaClockRotateLeft,
  FaShieldHalved,
  FaArrowRight,
} from "react-icons/fa6";
import { useEffect, useState } from "react";
import { Navigation } from "../components/Navigation.jsx";
import { Footer } from "../components/Footer.jsx";
import { fetchPublicModelStats } from "../services/publicApi.js";
import "../styles/LandingPage.css";

const highlights = [
  {
    icon: FaBrain,
    title: "AI-Powered Predictions",
    text: "Readmission risk scored instantly using a trained machine learning model — no manual chart review needed.",
  },
  {
    icon: FaClockRotateLeft,
    title: "24/7 Ready",
    text: "Built for continuous hospital workflows. Every discharge gets scored the moment it's logged, day or night.",
  },
  {
    icon: FaShieldHalved,
    title: "Secure by Design",
    text: "Role-based access keeps every care team seeing only what they need, from intake to prediction.",
  },
];

// Signature motif: an ECG-style trace that draws itself once on load.
// Reused in the hero readout and as a section divider — a visual shorthand
// for "reading a patient's vitals" that ties directly to what the product does.
function PulseTrace({ className = "" }) {
  return (
    <svg
      className={`pulse-trace ${className}`}
      viewBox="0 0 400 48"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g className="pulse-trace-scroll">
        <path
          className="pulse-trace-path"
          d="M0,24 L120,24 L136,24 L146,6 L158,42 L170,16 L180,24 L400,24"
          fill="none"
        />
        <path
          className="pulse-trace-path"
          d="M400,24 L520,24 L536,24 L546,6 L558,42 L570,16 L580,24 L800,24"
          fill="none"
        />
      </g>
    </svg>
  );
}

export function LandingPage() {
  const [accuracy, setAccuracy] = useState("92.4%");

  useEffect(() => {
    fetchPublicModelStats().then((data) => {
      if (data.accuracy) setAccuracy(data.accuracy);
    });
  }, []);

  return (
    <div className="landing-shell">
      <Navigation mode="public" />

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-badge">Clinical Readmission Intelligence</span>
            <h1>HealthForecastAI</h1>
            <p className="landing-subtitle">Hospital Readmission Prediction System</p>
            <p className="landing-description">
              Predict patient readmission risk using machine learning to help
              care teams identify vulnerable cases earlier and support better
              post-discharge planning.
            </p>

            <div className="landing-actions">
              <NavLink to="/register" className="landing-primary-button">
                Get Started <FaArrowRight aria-hidden="true" />
              </NavLink>
              <NavLink to="/login" className="landing-secondary-button">
                Login
              </NavLink>
            </div>
          </div>

          <div className="landing-hero-panel">
            <div className="landing-panel-header">
              <span className="landing-panel-tag">System Status</span>
              <span className="landing-panel-status">
                <span className="landing-status-dot" aria-hidden="true" />
                Ready
              </span>
            </div>

            <div className="landing-panel-metric landing-panel-metric-primary">
              <div className="landing-metric-trace">
                <PulseTrace />
              </div>
              <strong>{accuracy}</strong>
              <span>Prediction accuracy · latest deployed model</span>
            </div>

            <div className="landing-panel-readout">
              <div className="landing-readout-row">
                <span className="landing-readout-label">Uptime</span>
                <span className="landing-readout-value">24 / 7</span>
              </div>
              <div className="landing-readout-row">
                <span className="landing-readout-label">Data</span>
                <span className="landing-readout-value">Encrypted, role-gated</span>
              </div>
            </div>
          </div>
        </section>

        <div className="landing-divider">
          <PulseTrace />
        </div>

        <section className="landing-highlights">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="landing-highlight-card">
                <div className="landing-highlight-icon">
                  <Icon aria-hidden="true" />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </section>
      </main>

      <Footer />
    </div>
  );
}