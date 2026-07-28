export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand-block">
        <strong>HealthForecastAI</strong>
        <p>Healthcare decision support for readmission risk screening.</p>
      </div>

      <div className="footer-columns">
        <div>
          <span className="footer-label">Technology stack</span>
          <p>React, Vite, Flask, XGBoost, Axios, React Icons</p>
        </div>
        <div>
          <span className="footer-label">GitHub</span>
          <p>github.com/your-org/healthforecastai</p>
        </div>
        <div>
          <span className="footer-label">Contact</span>
          <p>contact@healthforecastai.example</p>
        </div>
      </div>
    </footer>
  )
}