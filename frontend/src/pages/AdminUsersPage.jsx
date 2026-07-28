import { useEffect, useRef, useState } from 'react'
import {
  FaUserPlus,
  FaMagnifyingGlass,
  FaEllipsisVertical,
  FaPen,
  FaUserSlash,
  FaUserCheck,
  FaTrash,
  FaXmark,
} from 'react-icons/fa6'

const initialUsers = [
  { id: 1, name: 'Dr. Sarah Mitchell', email: 'sarah.mitchell@hospital.org', role: 'Doctor', status: 'Active', lastActive: '2 min ago' },
  { id: 2, name: 'Dr. James Cole', email: 'james.cole@hospital.org', role: 'Doctor', status: 'Active', lastActive: '18 min ago' },
  { id: 3, name: 'Dr. Priya Nair', email: 'priya.nair@hospital.org', role: 'Doctor', status: 'Inactive', lastActive: '3 days ago' },
  { id: 4, name: 'Alex Carter', email: 'alex.carter@hospital.org', role: 'Administrator', status: 'Active', lastActive: 'Just now' },
  { id: 5, name: 'Dr. Meera Iyer', email: 'meera.iyer@hospital.org', role: 'Researcher', status: 'Active', lastActive: '1 hr ago' },
  { id: 6, name: 'Ravi Shah', email: 'ravi.shah@hospital.org', role: 'Hospital Administrator', status: 'Active', lastActive: '4 hr ago' },
]

const roleFilters = ['All', 'Doctor', 'Administrator', 'Researcher', 'Hospital Administrator']
const inviteRoles = ['Doctor', 'Administrator', 'Researcher', 'Hospital Administrator']

function initials(name) {
  return name
    .replace('Dr. ', '')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function AdminUsersPage() {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Doctor' })

  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'All' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
      )
    )
    setOpenMenuId(null)
  }

  const removeUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
    setOpenMenuId(null)
  }

  const handleInviteSubmit = (event) => {
    event.preventDefault()
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return

    setUsers((prev) => [
      {
        id: Date.now(),
        name: inviteForm.name,
        email: inviteForm.email,
        role: inviteForm.role,
        status: 'Active',
        lastActive: 'Just now',
      },
      ...prev,
    ])
    setInviteForm({ name: '', email: '', role: 'Doctor' })
    setShowInviteModal(false)
  }

  return (
    <>
      <div className="dashboard-page-header">
        <h1>User Management</h1>
        <p>View, invite, and manage every account on HealthForecastAI.</p>
      </div>

      <section className="dashboard-panel dashboard-table-panel">
        <div className="panel-header-row">
          <div>
            <h2>All Users</h2>
            <p>Search and filter accounts by role</p>
          </div>

          <div className="dashboard-inline-actions">
            <button type="button" className="primary-button" onClick={() => setShowInviteModal(true)}>
              <FaUserPlus aria-hidden="true" /> Invite User
            </button>
          </div>
        </div>

        <div className="dashboard-toolbar">
          <div className="dashboard-search">
            <FaMagnifyingGlass aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="dashboard-filter-row">
            {roleFilters.map((role) => (
              <button
                key={role}
                type="button"
                className={`filter-chip${roleFilter === role ? ' filter-chip-active' : ''}`}
                onClick={() => setRoleFilter(role)}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Active</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="user-cell">
                      <span className="user-avatar">{initials(row.name)}</span>
                      <div className="user-cell-text">
                        <span className="user-cell-name">{row.name}</span>
                        <span className="user-cell-email">{row.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{row.role}</td>
                  <td>
                    <span className={`risk-pill ${row.status === 'Active' ? 'low' : 'high'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.lastActive}</td>
                  <td className="dashboard-table-action-cell">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`More actions for ${row.name}`}
                      onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
                    >
                      <FaEllipsisVertical aria-hidden="true" />
                    </button>

                    {openMenuId === row.id && (
                      <div className="row-menu" ref={menuRef}>
                        <button type="button" className="row-menu-item">
                          <FaPen aria-hidden="true" /> Edit user
                        </button>
                        <button type="button" className="row-menu-item" onClick={() => toggleStatus(row.id)}>
                          {row.status === 'Active' ? (
                            <>
                              <FaUserSlash aria-hidden="true" /> Deactivate
                            </>
                          ) : (
                            <>
                              <FaUserCheck aria-hidden="true" /> Activate
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="row-menu-item row-menu-item-danger"
                          onClick={() => removeUser(row.id)}
                        >
                          <FaTrash aria-hidden="true" /> Remove user
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="dashboard-table-empty">
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showInviteModal && (
        <div className="modal-backdrop" onClick={() => setShowInviteModal(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <h3 id="invite-title">Invite User</h3>
              <button
                type="button"
                className="icon-button"
                aria-label="Close"
                onClick={() => setShowInviteModal(false)}
              >
                <FaXmark aria-hidden="true" />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleInviteSubmit}>
              <label className="modal-field">
                <span>Full Name</span>
                <input
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Dr. Ananya Sharma"
                  required
                />
              </label>

              <label className="modal-field">
                <span>Email address</span>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="name@hospital.org"
                  required
                />
              </label>

              <label className="modal-field">
                <span>Role</span>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value }))}
                >
                  {inviteRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}