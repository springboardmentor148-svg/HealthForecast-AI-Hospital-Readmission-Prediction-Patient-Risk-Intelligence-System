import { profile } from './mockData.js'

export function ProfilePage() {
  return (
    <section className="dashboard-panel dashboard-panel-wide profile-card">
      <div className="profile-avatar">SM</div>
      <div>
        <h2>{profile.fullName}</h2>
        <p>{profile.role}</p>
      </div>

      <div className="profile-details-grid">
        <div><span>Email</span><strong>{profile.email}</strong></div>
        <div><span>Hospital</span><strong>{profile.hospital}</strong></div>
        <div><span>Department</span><strong>{profile.department}</strong></div>
        <div><span>Role</span><strong>{profile.role}</strong></div>
        <div><span>Phone Number</span><strong>{profile.phone}</strong></div>
      </div>

      <button type="button" className="primary-button">Edit Profile</button>
    </section>
  )
}
