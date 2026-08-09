import { useEffect, useState } from 'react'
import {
  fetchReportSummary,
  fetchHighRiskPatients,
  fetchLowRiskPatients,
  fetchMonthlyStats,
} from '../services/reportsApi.js'

function buildCsvContent(reportSummary) {
  const rows = [
    ['Metric', 'Value'],
    ...reportSummary.map((item) => [item.label, item.value]),
  ]
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

function downloadCsv(reportSummary) {
  const blob = new Blob([buildCsvContent(reportSummary)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `healthforecastai-report-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function downloadPdf(reportSummary) {
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) return
  const summaryRows = reportSummary
    .map((item) => `<tr><td>${item.label}</td><td>${item.value}</td></tr>`)
    .join('')
  printWindow.document.write(`
    <html>
      <head><title>HealthForecastAI Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        table { border-collapse: collapse; width: 100%; }
        td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; }
        td:last-child { font-weight: 700; text-align: right; }
      </style></head>
      <body>
        <h1>HealthForecastAI — Prediction Report</h1>
        <p>Generated ${new Date().toLocaleString()}</p>
        <table>${summaryRows}</table>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}

export function ReportsPage() {
  const [reportSummary, setReportSummary] = useState([])
  const [highRisk, setHighRisk] = useState([])
  const [lowRisk, setLowRisk] = useState([])
  const [monthlyStats, setMonthlyStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadAll() {
      setIsLoading(true)
      setError(null)
      try {
        const [summary, hr, lr, stats] = await Promise.all([
          fetchReportSummary(),
          fetchHighRiskPatients(),
          fetchLowRiskPatients(),
          fetchMonthlyStats(),
        ])
        if (isMounted) {
          setReportSummary([
            { label: 'Monthly Predictions', value: String(summary.monthlyPredictions) },
            { label: 'High Risk Cases', value: String(summary.highRiskCases) },
            { label: 'Low Risk Cases', value: String(summary.lowRiskCases) },
            { label: 'Average Confidence', value: summary.averageConfidence },
          ])
          setHighRisk(hr)
          setLowRisk(lr)
          setMonthlyStats(stats)
        }
      } catch (err) {
        if (isMounted) setError(err?.message || 'Failed to load reports.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadAll()
    return () => { isMounted = false }
  }, [])

  return (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="panel-header-row">
        <div>
          <h2>Reports</h2>
          <p>Ready-to-share prediction summaries and export actions</p>
        </div>
        <div className="dashboard-inline-actions">
          <button type="button" className="secondary-button" onClick={() => downloadPdf(reportSummary)} disabled={isLoading}>
            Download PDF
          </button>
          <button type="button" className="primary-button" onClick={() => downloadCsv(reportSummary)} disabled={isLoading}>
            Download CSV
          </button>
        </div>
      </div>

      {isLoading && <p>Loading report data...</p>}
      {!isLoading && error && <p className="access-error" role="alert">{error}</p>}

      {!isLoading && !error && (
        <>
          <div className="dashboard-card-grid">
            {reportSummary.map((item) => (
              <article key={item.label} className="dashboard-metric-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>

          <div className="report-grid" style={{ marginTop: '22px', display: 'grid', gap: '20px' }}>
            <article className="dashboard-panel">
              <h3>High Risk Patients</h3>
              <p style={{ marginBottom: '14px' }}>Escalation list ready for care coordination review.</p>
              {highRisk.length === 0 && <p style={{ opacity: 0.7 }}>No high risk patients found.</p>}
              {highRisk.length > 0 && (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Name</th>
                        <th>Condition</th>
                        <th>Readmission Prob.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highRisk.map((p) => (
                        <tr key={p.patientId}>
                          <td>{p.patientId}</td>
                          <td>{p.name}</td>
                          <td>{p.condition}</td>
                          <td>{p.readmissionProbability || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            <article className="dashboard-panel">
              <h3>Low Risk Patients</h3>
              <p style={{ marginBottom: '14px' }}>Stable patients with standard follow-up requirements.</p>
              {lowRisk.length === 0 && <p style={{ opacity: 0.7 }}>No low risk patients found.</p>}
              {lowRisk.length > 0 && (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Patient ID</th>
                        <th>Name</th>
                        <th>Condition</th>
                        <th>Readmission Prob.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowRisk.map((p) => (
                        <tr key={p.patientId}>
                          <td>{p.patientId}</td>
                          <td>{p.name}</td>
                          <td>{p.condition}</td>
                          <td>{p.readmissionProbability || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>

            <article className="dashboard-panel">
              <h3>Monthly Statistics</h3>
              <p style={{ marginBottom: '14px' }}>Chart-ready reporting view for operational leadership.</p>
              {monthlyStats && (
                <div className="dashboard-card-grid">
                  <article className="dashboard-metric-card">
                    <span>Total This Month</span>
                    <strong>{monthlyStats.totalThisMonth}</strong>
                  </article>
                  <article className="dashboard-metric-card">
                    <span>Readmission Predicted</span>
                    <strong>{monthlyStats.readmissionPredicted}</strong>
                  </article>
                  <article className="dashboard-metric-card">
                    <span>No Readmission Predicted</span>
                    <strong>{monthlyStats.noReadmissionPredicted}</strong>
                  </article>
                </div>
              )}
            </article>
          </div>
        </>
      )}
    </section>
  )
}