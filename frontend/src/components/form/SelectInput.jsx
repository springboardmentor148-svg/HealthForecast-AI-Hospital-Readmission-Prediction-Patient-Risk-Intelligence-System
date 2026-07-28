export function SelectInput({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
}) {
  return (
    <div className="form-field">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        className={`form-select ${error ? 'error' : ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
      >
        <option value="">Select an option</option>
        {Array.isArray(options) &&
          options.map((option) => (
            <option key={option} value={option}>
              {formatOptionLabel(option)}
            </option>
          ))}
      </select>
      {error && (
        <p id={`${name}-error`} className="form-error">
          {error}
        </p>
      )}
    </div>
  )
}

function formatOptionLabel(value) {
  // Format numeric IDs or diagnosis codes
  if (!isNaN(value)) {
    return `Code ${value}`
  }
  // Format text by replacing underscores and capitalizing
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
