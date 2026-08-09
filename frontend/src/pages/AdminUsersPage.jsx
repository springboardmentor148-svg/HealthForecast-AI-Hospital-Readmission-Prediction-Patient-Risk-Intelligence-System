import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  FaUserPlus,
  FaMagnifyingGlass,
  FaEllipsisVertical,
  FaPen,
  FaUserSlash,
  FaUserCheck,
  FaTrash,
  FaXmark,
  FaUserGear,
} from 'react-icons/fa6'
import {
  fetchAdminUsers,
  inviteAdminUser,
  toggleUserActive,
  updateUserRole,
  editAdminUser,
  removeAdminUser,
} from '../services/adminApi.js'

const roleFilters = ['All', 'Doctor', 'Hospital Administrator', 'Healthcare Researcher', 'System Administrator']
const inviteRoles = ['Doctor', 'Hospital Administrator', 'Healthcare Researcher', 'System Administrator']

function initials(name) {
  return (name || '')
    .replace('Dr. ', '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatJoined(isoString) {
  if (!isoString) return '—'
  const date = new Date(isoString)
  return `Joined ${date.toLocaleDateString()}`
}

function mapBackendUser(u) {
  return {
    id: u.id,
    name: u.fullName,
    email: u.email,
    mobileNumber: u.mobileNumber,
    role: u.userRole,
    status: u.isActive ? 'Active' : 'Inactive',
    lastActive: formatJoined(u.createdAt),
  }
}

export function AdminUsersPage() {
  const { user: currentAdmin } = useOutletContext()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [openMenuId, setOpenMenuId] = useState(null)

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    role: 'Doctor',
  })
  const [inviteError, setInviteError] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  const [roleModalUser, setRoleModalUser] = useState(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [roleChangeError, setRoleChangeError] = useState('')

  const [editModalUser, setEditModalUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', mobileNumber: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState('')

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

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAdminUsers()
      setUsers(data.map(mapBackendUser))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'All' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const toggleStatus = async (id) => {
    setOpenMenuId(null)
    try {
      await toggleUserActive(id)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
        )
      )
    } catch (err) {
      alert(err.message)
    }
  }

  const removeUser = async (id) => {
    setOpenMenuId(null)
    try {
      await removeAdminUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  const openRoleModal = (row) => {
    setOpenMenuId(null)
    setRoleModalUser(row)
    setSelectedRole(row.role)
    setRoleChangeError('')
  }

  const openEditModal = (row) => {
    setOpenMenuId(null)
    setEditModalUser(row)
    setEditForm({ name: row.name, email: row.email, mobileNumber: row.mobileNumber || '' })
    setEditError('')
  }

  const handleEditSubmit = async (event) => {
    event.preventDefault()
    if (!editModalUser) return
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.mobileNumber.trim()) {
      setEditError('Please fill all fields.')
      return
    }

    setIsEditing(true)
    setEditError('')

    try {
      const updated = await editAdminUser(editModalUser.id, {
        fullName: editForm.name,
        email: editForm.email,
        mobileNumber: editForm.mobileNumber,
      })
      setUsers((prev) =>
        prev.map((u) => (u.id === editModalUser.id ? mapBackendUser(updated) : u))
      )
      setEditModalUser(null)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setIsEditing(false)
    }
  }

  const handleRoleChangeSubmit = async (event) => {
    event.preventDefault()
    if (!roleModalUser) return

    setIsChangingRole(true)
    setRoleChangeError('')

    try {
      await updateUserRole(roleModalUser.id, selectedRole)
      setUsers((prev) =>
        prev.map((u) => (u.id === roleModalUser.id ? { ...u, role: selectedRole } : u))
      )
      setRoleModalUser(null)
    } catch (err) {
      setRoleChangeError(err.message)
    } finally {
      setIsChangingRole(false)
    }
  }

  const handleInviteSubmit = async (event) => {
    event.preventDefault()
    if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.mobileNumber.trim() || !inviteForm.password.trim()) {
      setInviteError('Please fill all required fields.')
      return
    }

    setIsInviting(true)
    setInviteError('')

    try {
      const payload = {
        fullName: inviteForm.name,
        email: inviteForm.email,
        mobileNumber: inviteForm.mobileNumber,
        userRole: inviteForm.role,
        password: inviteForm.password,
        hospitalName: currentAdmin?.hospitalName || '',
        hospitalType: currentAdmin?.hospitalType || '',
        ownershipType: currentAdmin?.ownershipType || '',
        hospitalContact: currentAdmin?.hospitalContact || '',
        hospitalAddress: currentAdmin?.hospitalAddress || '',
        department: inviteForm.role === 'Doctor' ? 'General' : null,
      }

      const newUser = await inviteAdminUser(payload)
      setUsers((prev) => [mapBackendUser(newUser), ...prev])
      setInviteForm({ name: '', email: '', mobileNumber: '', password: '', role: 'Doctor' })
      setShowInviteModal(false)
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setIsInviting(false)
    }
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
              {loading && (
                <tr>
                  <td colSpan={5} className="dashboard-table-empty">Loading users...</td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={5} className="dashboard-table-empty">{error}</td>
                </tr>
              )}

              {!loading && !error && filteredUsers.map((row) => {
                const isSelf = currentAdmin?.id === row.id
                return (
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
                          <button type="button" className="row-menu-item" onClick={() => openEditModal(row)}>
                            <FaPen aria-hidden="true" /> Edit user
                          </button>
                          {!isSelf && (
                            <button type="button" className="row-menu-item" onClick={() => openRoleModal(row)}>
                              <FaUserGear aria-hidden="true" /> Change Role
                            </button>
                          )}
                          {!isSelf && (
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
                          )}
                          {!isSelf && (
                            <button
                              type="button"
                              className="row-menu-item row-menu-item-danger"
                              onClick={() => removeUser(row.id)}
                            >
                              <FaTrash aria-hidden="true" /> Remove user
                            </button>
                          )}
                          {isSelf && (
                            <span className="row-menu-item" style={{ opacity: 0.6, cursor: 'default' }}>
                              This is your account
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}

              {!loading && !error && filteredUsers.length === 0 && (
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
                <span>Mobile Number</span>
                <input
                  value={inviteForm.mobileNumber}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                  placeholder="9876543210"
                  required
                />
              </label>

              <label className="modal-field">
                <span>Temporary Password</span>
                <input
                  type="text"
                  value={inviteForm.password}
                  onChange={(e) => setInviteForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Set an initial password"
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

              {inviteError && <p className="dashboard-table-empty">{inviteError}</p>}

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isInviting}>
                  {isInviting ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {roleModalUser && (
        <div className="modal-backdrop" onClick={() => setRoleModalUser(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <h3 id="role-title">Change Role — {roleModalUser.name}</h3>
              <button
                type="button"
                className="icon-button"
                aria-label="Close"
                onClick={() => setRoleModalUser(null)}
              >
                <FaXmark aria-hidden="true" />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleRoleChangeSubmit}>
              <label className="modal-field">
                <span>New Role</span>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  {inviteRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              {roleChangeError && <p className="dashboard-table-empty">{roleChangeError}</p>}

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setRoleModalUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isChangingRole}>
                  {isChangingRole ? 'Saving...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editModalUser && (
        <div className="modal-backdrop" onClick={() => setEditModalUser(null)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <h3 id="edit-title">Edit User — {editModalUser.name}</h3>
              <button
                type="button"
                className="icon-button"
                aria-label="Close"
                onClick={() => setEditModalUser(null)}
              >
                <FaXmark aria-hidden="true" />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleEditSubmit}>
              <label className="modal-field">
                <span>Full Name</span>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>

              <label className="modal-field">
                <span>Email address</span>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </label>

              <label className="modal-field">
                <span>Mobile Number</span>
                <input
                  value={editForm.mobileNumber}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                  required
                />
              </label>

              {editError && <p className="dashboard-table-empty">{editError}</p>}

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setEditModalUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isEditing}>
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}