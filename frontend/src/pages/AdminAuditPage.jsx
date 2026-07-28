import { useState } from 'react'
import {
  FaCircleCheck,
  FaTriangleExclamation,
  FaCircleInfo,
  FaFilter,
} from 'react-icons/fa6'

const fullAuditLog = [
  { icon: FaCircleCheck, tone: 'info', text: 'Alex Carter updated system settings.', time: '10 min ago', category: 'Settings' },
  { icon: FaTriangleExclamation, tone: 'warning', text: 'Failed login attempt for dr.cole@hospital.org.', time: '1 hr ago', category: 'Security' },
  { icon: FaCircleCheck, tone: 'neutral', text: 'New doctor account created: Dr. Priya Nair.', time: 'Yesterday', category: 'Users' },
  { icon: FaCircleInfo, tone: 'info', text: 'Weekly prediction report generated automatically.', time: 'Yesterday', category: 'Reports' },
  { icon: FaTriangleExclamation, tone: 'warning', text: 'Unusual API request volume detected from one account.', time: '2 days ago', category: 'Security' },
  { icon: FaCircleCheck, tone: 'neutral', text: 'Dr. James Cole password reset completed.', time: '3 days ago', category: 'Users' },
]

const categories = ['All', 'Security', 'Users', 'Settings', 'Reports']

export function AdminAuditPage() {
  const [category, setCategory] = useState('All')

  const filteredLog = fullAuditLog.filter(
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
          {filteredLog.map((entry, index) => {
            const Icon = entry.icon
            return (
              <li key={index} className="notification-item">
                <span className={`notification-icon tone-${entry.tone}`}>
                  <Icon />
                </span>
                <div className="notification-body">
                  <p>{entry.text}</p>
                  <span className="notification-time">
                    {entry.category} · {entry.time}
                  </span>
                </div>
              </li>
            )
          })}

          {filteredLog.length === 0 && (
            <li className="dashboard-table-empty">No events in this category.</li>
          )}
        </ul>
      </section>
    </>
  )
}