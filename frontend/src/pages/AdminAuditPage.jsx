import { useEffect, useState } from 'react'
import {
  FaCircleCheck,
  FaTriangleExclamation,
  FaCircleInfo,
} from 'react-icons/fa6'
import { fetchAuditLogs } from '../services/adminApi.js'

function getIconTone(action) {
  if (!action) return { icon: FaCircleInfo, tone: 'info' }
  if (action.includes('REMOVED') || action.includes('FAILED')) {
    return { icon: FaTriangleExclamation, tone: 'warning' }
  }
  if (action.includes('INVITED') || action.includes('ACTIVATED')) {
    return { icon: FaCircleCheck, tone: 'neutral' }
  }
  return { icon: FaCircleInfo, tone: 'info' }
}

function formatTimeAgo(isoString) {
  if (!isoString) return ''
  const then = new Date(isoString)
  const diffMs = Date.now() - then.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

function actionToText(log) {
  const actorName = log.actorName || 'Someone'
  const target = log.target ? ` — ${log.target}` : ''
  const details = log.details ? ` (${log.details})` : ''

  switch (log.action) {
    case 'USER_INVITED':
      return `${actorName} invited a new user${target}${details}.`
    case 'USER_ACTIVATED':
      return `${actorName} activated${target}.`
    case 'USER_DEACTIVATED':
      return `${actorName} deactivated${target}.`
    case 'ROLE_CHANGED':
      return `${actorName} changed role for${target}${details}.`
    case 'USER_REMOVED':
      return `${actorName} removed${target}.`
    default:
      return `${actorName} performed ${log.action}${target}.`
  }
}

export function AdminAuditPage() {
  const [logs, setLogs] = useState([])
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadLogs() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchAuditLogs()
        setLogs(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadLogs()
  }, [])

  const categories = ['All', ...new Set(logs.map((l) => l.category))]

  const filteredLog = logs.filter(
    (entry) => category === 'All' || entry.category === category
  )

  return (
    <>
      <div className="dashboard-page-header">
        <h1>Audit Logs</h1>
        <p>Track every meaningful action across the platform for accountability and security review.</p>
      </div>

      <section className="dashboard-panel">
        <div className="panel-header-row">
          <div>
            <h2>Activity Timeline</h2>
            <p>Filter by category to narrow down events</p>
          </div>

          <div className="dashboard-filter-row">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`filter-chip${category === c ? ' filter-chip-active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <ul className="notification-list">
          {loading && <li className="dashboard-table-empty">Loading...</li>}

          {!loading && error && (
            <li className="dashboard-table-empty">{error}</li>
          )}

          {!loading && !error && filteredLog.map((entry) => {
            const { icon: Icon, tone } = getIconTone(entry.action)
            return (
              <li key={entry.id} className="notification-item">
                <span className={`notification-icon tone-${tone}`}>
                  <Icon />
                </span>
                <div className="notification-body">
                  <p>{actionToText(entry)}</p>
                  <span className="notification-time">
                    {entry.category} · {formatTimeAgo(entry.timestamp)}
                  </span>
                </div>
              </li>
            )
          })}

          {!loading && !error && filteredLog.length === 0 && (
            <li className="dashboard-table-empty">No events in this category.</li>
          )}
        </ul>
      </section>
    </>
  )
}