export function FeatureCard({ title, description, meta, icon: Icon }) {
  return (
    <article className="feature-card">
      <div className="feature-card-top">
        <span className="feature-meta">{meta}</span>
        {Icon && (
          <span className="feature-icon" aria-hidden="true">
            <Icon />
          </span>
        )}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}