import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPredictionHistory } from '../services/predictionHistoryApi.js'

export function PredictionHistoryPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [page, setPage] = useState(1)

  const [historyRows, setHistoryRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadHistory() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await fetchPredictionHistory()

        // Backend response ko table ke expected shape me map karo
        const mappedRows = data.map((item) => ({
          patientId: `PT-${item.id}`,
          patientName: item.patientName || '—',
          prediction: item.result,
          confidence: item.confidence,
          riskLevel: item.riskLevel,
          date: new Date(item.createdAt).toLocaleString(),
        }))

        if (isMounted) {
          setHistoryRows(mappedRows)
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Failed to load prediction history.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredRows = useMemo(() => {
    return historyRows.filter((row) => {
      const matchesQuery = `${row.patientId} ${row.patientName}`.toLowerCase().includes(query.toLowerCase())
      const matchesRisk = riskFilter === 'All' || row.riskLevel === riskFilter
      return matchesQuery && matchesRisk
    })
  }, [query, riskFilter, historyRows])

  return (
    <section className="dashboard-panel dashboard-panel-wide">
      <div className="panel-header-row">
        <div>
          <h2>Prediction History</h2>
          <p>Search, filter, and review previous prediction results</p>
        </div>
        <div className="dashboard-toolbar">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patient" />
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
            <option>All</option>
            <option>High</option>
            <option>Low</option>
          </select>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate('/app/doctor/predictions/new')}
          >
            + New Prediction
          </button>
        </div>
      </div>

      {isLoading && <p>Loading prediction history...</p>}

      {!isLoading && error && (
        <p className="access-error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && (
        <>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Prediction</th>
                  <th>Confidence</th>
                  <th>Risk Level</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.slice((page - 1) * 5, page * 5).map((row) => (
                  <tr key={row.patientId}>
                    <td>{row.patientId}</td>
                    <td>{row.patientName}</td>
                    <td>{row.prediction}</td>
                    <td>{row.confidence}</td>
                    <td><span className={`risk-pill ${row.riskLevel === 'High' ? 'high' : 'low'}`}>{row.riskLevel}</span></td>
                    <td>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-row">
            <button type="button" className="secondary-button" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Previous</button>
            <span>Page {page}</span>
            <button type="button" className="secondary-button" onClick={() => setPage((prev) => prev + 1)}>Next</button>
          </div>
        </>
      )}
    </section>
  )
}