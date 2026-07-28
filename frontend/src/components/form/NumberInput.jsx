export function NumberInput({
  label,
  name,
  value,
  onChange,
  min,
  max,
  error,
  required,
}) {
  return (
    <div className="form-field">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <input
        id={name}
        type="number"
        name={name}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value ? Number(e.target.value) : '')}
        min={min}
        max={max}
        className={`form-input ${error ? 'error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="form-error">
          {error}
        </p>
      )}
    </div>
  )
}
