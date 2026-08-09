import { useState } from 'react'
import { FaXmark } from 'react-icons/fa6'
import { useAuth } from '../auth/AuthContext.jsx'

function getInitials(fullName) {
  if (!fullName) return '?'
  return fullName
    .replace('Dr. ', '')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function ProfilePage() {
  const { user, updateUser } = useAuth()

  const [showEditModal, setShowEditModal] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    hospital: user?.hospital || '',
    department: user?.department || '',
    phone: user?.phone || '',
  })

  const openEditModal = () => {
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      hospital: user?.hospital || '',
      department: user?.department || '',
      phone: user?.phone || '',
    })
    setShowEditModal(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    updateUser(form)
    setShowEditModal(false)
    setSavedMessage('Profile updated successfully.')
    setTimeout(() => setSavedMessage(''), 3000)
  }

  return (
    <>
      {savedMessage && <div className="settings-toast">{savedMessage}</div>}

      <section className="dashboard-panel dashboard-panel-wide profile-card">
        <div className="profile-avatar">{getInitials(user?.fullName)}</div>
        <div>
          <h2>{user?.fullName || 'Unknown User'}</h2>
          <p>{user?.role || '—'}</p>
        </div>

        <div className="profile-details-grid">
          <div><span>Email</span><strong>{user?.email || '—'}</strong></div>
          <div><span>Hospital</span><strong>{user?.hospital || '—'}</strong></div>
          <div><span>Hospital</span><strong>{user?.hospital || '—'}</strong></div>
          <div><span>Hospital Address</span><strong>{user?.hospitalAddress || '—'}</strong></div>
          <div><span>Department</span><strong>{user?.department || 'Not set'}</strong></div>
          <div><span>Role</span><strong>{user?.role || '—'}</strong></div>
          <div><span>Phone Number</span><strong>{user?.phone || 'Not set'}</strong></div>
        </div>

        <button type="button" className="primary-button" onClick={openEditModal}>
          Edit Profile
        </button>
      </section>

      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-profile-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <h3 id="edit-profile-title">Edit Profile</h3>
              <button
                type="button"
                className="icon-button"
                aria-label="Close"
                onClick={() => setShowEditModal(false)}
              >
                <FaXmark aria-hidden="true" />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <label className="modal-field">
                <span>Full Name</span>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </label>

              <label className="modal-field">
                <span>Email address</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </label>

              <label className="modal-field">
                <span>Hospital</span>
                <input
                  value={form.hospital}
                  onChange={(e) => setForm((prev) => ({ ...prev, hospital: e.target.value }))}
                />
              </label>

              <label className="modal-field">
                <span>Department</span>
                <input
                  value={form.department}
                  onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                />
              </label>

              <label className="modal-field">
                <span>Phone Number</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}