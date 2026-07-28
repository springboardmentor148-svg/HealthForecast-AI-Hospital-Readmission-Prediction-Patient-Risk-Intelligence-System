import { reportSummary } from './mockData.js'

export function ReportsPage() {
  return (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="panel-header-row">
        <div>
          <h2>Reports</h2>
          <p>Ready-to-share prediction summaries and export actions</p>
        </div>
        <div className="dashboard-inline-actions">
          <button type="button" className="secondary-button">Download PDF</button>
          <button type="button" className="primary-button">Download CSV</button>
        </div>
      </div>

      <div className="analytics-summary-grid">
        {reportSummary.map((item) => (
          <article key={item.label} className="dashboard-stat-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      <div className="report-grid">
        <article className="dashboard-panel">
          <h3>Prediction Summary</h3>
          <p>Monthly reporting overview with trend-aware prediction performance.</p>
        </article>
        <article className="dashboard-panel">
          <h3>High Risk Patients</h3>
          <p>Escalation list ready for care coordination review.</p>
        </article>
        <article className="dashboard-panel">
          <h3>Low Risk Patients</h3>
          <p>Stable patients with standard follow-up requirements.</p>
        </article>
        <article className="dashboard-panel">
          <h3>Monthly Statistics</h3>
          <p>Chart-ready reporting view for operational leadership.</p>
        </article>
      </div>
    </section>
  )
}
