export function SettingsPage() {
  return (
    <section className="dashboard-panel dashboard-panel-wide">
      <h2>Settings</h2>
      <div className="settings-list">
        <label className="setting-row"><span>Notification Settings</span><input type="checkbox" defaultChecked /></label>
        <label className="setting-row"><span>Language</span><select><option>English</option><option>Spanish</option></select></label>
        <button type="button" className="secondary-button">Change Password</button>
        <button type="button" className="secondary-button">Privacy Settings</button>
        <button type="button" className="primary-button">Logout</button>
      </div>
    </section>
  )
}