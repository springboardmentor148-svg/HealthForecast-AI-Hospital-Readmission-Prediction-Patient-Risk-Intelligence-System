import { useState } from 'react'
import { PredictionForm } from '../components/PredictionForm.jsx'
import { LoadingSpinner } from '../components/LoadingSpinner.jsx'
import { ResultPanel } from '../components/ResultPanel.jsx'
import { predictReadmission } from '../services/api.js'
import '../styles/prediction.css'

export function PredictionPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const apiResponse = await predictReadmission(formData)
      const isReadmission = apiResponse.prediction === 1

      setResult({
        prediction: apiResponse.prediction,
        result: apiResponse.result,
        confidence: apiResponse.confidence,
        riskLevel: isReadmission ? 'High' : 'Low',
        timestamp: new Date().toLocaleString(),
        message: isReadmission
          ? 'The model predicts a readmission risk. Consider closer follow-up and discharge planning.'
          : 'The model predicts no readmission risk. Routine follow-up care is recommended.',
      })
    } catch (err) {
      setError(
        err?.message ||
          'Prediction failed. Please check your inputs and try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
  }

  return (
    <main className="prediction-page">
      <div className="prediction-header">
        <span className="prediction-eyebrow">Clinical dashboard</span>
        <h1>Patient Readmission Prediction</h1>
        <p>
          Review patient information, validate the clinical inputs, and generate a
          readmission assessment from the Flask-backed XGBoost model.
        </p>
      </div>

      <div className="prediction-container">
        <div className="prediction-panel">
          {isLoading && <LoadingSpinner />}

          {!isLoading && !result && (
            <PredictionForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
            />
          )}

          {!isLoading && result && (
            <ResultPanel result={result} onReset={handleReset} />
          )}
        </div>
      </div>
    </main>
  )
}