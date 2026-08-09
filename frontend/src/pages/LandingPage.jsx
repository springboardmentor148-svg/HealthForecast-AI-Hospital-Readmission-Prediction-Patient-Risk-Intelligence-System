import { NavLink } from "react-router-dom";
import {
  FaBrain,
  FaClockRotateLeft,
  FaShieldHalved,
  FaArrowRight,
  FaChartLine,
} from "react-icons/fa6";
import { Navigation } from "../components/Navigation.jsx";
import { Footer } from "../components/Footer.jsx";
import "../styles/LandingPage.css";

const highlights = [
  {
    icon: FaBrain,
    title: "AI-Powered Predictions",
    text: "Readmission risk scored instantly using a trained machine learning model.",
  },
  {
    icon: FaClockRotateLeft,
    title: "24/7 Ready",
    text: "Built for continuous hospital workflows, always available when you need it.",
  },
  {
    icon: FaShieldHalved,
    title: "Secure by Design",
    text: "Patient data stays protected end-to-end, from entry to prediction.",
  },
];

export function LandingPage() {
  return (
    <div className="landing-shell">
      <Navigation mode="public" />

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="landing-badge">Healthcare Analytics Platform</span>
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
              <span className="landing-panel-tag">System Overview</span>
              <span className="landing-panel-status">Ready</span>
            </div>

            <div className="landing-panel-metric">
              <FaChartLine aria-hidden="true" />
              <div>
                <strong>92.4%</strong>
                <span>Model prediction accuracy</span>
              </div>
            </div>

            <div className="landing-panel-metric">
              <FaClockRotateLeft aria-hidden="true" />
              <div>
                <strong>24/7</strong>
                <span>Continuous hospital workflow support</span>
              </div>
            </div>

            <div className="landing-panel-metric">
              <FaShieldHalved aria-hidden="true" />
              <div>
                <strong>Secure</strong>
                <span>End-to-end protected patient data</span>
              </div>
            </div>
          </div>
        </section>

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