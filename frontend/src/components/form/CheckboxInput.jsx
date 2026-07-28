export function CheckboxInput({ label, name, value, onChange }) {
  return (
    <div className="form-field checkbox-field">
      <label htmlFor={name} className="checkbox-label">
        <input
          id={name}
          type="checkbox"
          name={name}
          checked={value === 1 || value === true}
          onChange={(e) => onChange(name, e.target.checked ? 1 : 0)}
          className="checkbox-input"
        />
        <span className="checkbox-text">{label}</span>
      </label>
    </div>
  )
}
