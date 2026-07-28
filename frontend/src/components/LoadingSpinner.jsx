export function LoadingSpinner() {
  return (
    <div className="loading-overlay">
      <div className="spinner-container">
        <div className="spinner"></div>
        <p className="spinner-text">Predicting...</p>
        <p className="spinner-subtext">
          Sending patient data to the model and generating the result
        </p>
      </div>
    </div>
  )
}
