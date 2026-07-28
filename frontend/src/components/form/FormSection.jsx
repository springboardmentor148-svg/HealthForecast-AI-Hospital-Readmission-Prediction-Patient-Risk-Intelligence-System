export function FormSection({ title, description, children }) {
  return (
    <fieldset className="form-section">
      <legend className="section-legend">
        <h2 className="section-title">{title}</h2>
        {description && <p className="section-description">{description}</p>}
      </legend>
      <div className="section-content">{children}</div>
    </fieldset>
  )
}
