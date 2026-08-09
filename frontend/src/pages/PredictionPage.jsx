import { useState } from 'react'
import { PredictionForm } from '../components/PredictionForm.jsx'
import { LoadingSpinner } from '../components/LoadingSpinner.jsx'
import { ResultPanel } from '../components/ResultPanel.jsx'
import { predictReadmission } from '../services/api.js'
import { savePrediction } from '../services/predictionHistoryApi.js'
import { fetchPatients, createPatient } from '../services/patientsApi.js'
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

      const predictionResult = {
        patientName: formData.patientName || '',
        prediction: apiResponse.prediction,
        result: apiResponse.result,
        confidence: apiResponse.confidence,
        readmissionProbability: apiResponse.readmissionProbability,
        riskLevel: isReadmission ? 'High' : 'Low',
        timestamp: new Date().toLocaleString(),
        message: isReadmission
          ? 'The model predicts a readmission risk. Consider closer follow-up and discharge planning.'
          : 'The model predicts no readmission risk. Routine follow-up care is recommended.',
      }

      setResult(predictionResult)

      // Prediction history me save karo (background me — isse doctor ka result dikhna block nahi hona chahiye)
      try {
        await savePrediction({
          patientName: predictionResult.patientName,
          prediction: predictionResult.prediction,
          result: predictionResult.result,
          confidence: predictionResult.confidence,
          riskLevel: predictionResult.riskLevel,
          message: predictionResult.message,
        })
      } catch (saveErr) {
        console.error('Failed to save prediction history:', saveErr)
      }

      // Agar patient name diya gaya hai, to My Patients list me bhi add/update karo
      if (predictionResult.patientName) {
        try {
          const existingPatients = await fetchPatients()
          const alreadyExists = existingPatients.some(
            (p) => p.name.trim().toLowerCase() === predictionResult.patientName.trim().toLowerCase()
          )

          if (!alreadyExists) {
            const today = new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })

            await createPatient({
              name: predictionResult.patientName,
              age: Number(formData.age) || 0,
              gender: formData.gender || 'Unknown',
              condition: formData.diag_1
                ? `ICD-9 ${formData.diag_1}`
                : 'Not specified',
              admissionDate: today,
              lastVisit: today,
              riskLevel: predictionResult.riskLevel,
              readmissionProbability: predictionResult.readmissionProbability,
              confidence: predictionResult.confidence,
              medicalHistory: [],
            })
          }
        } catch (patientErr) {
          // Patient creation fail hui to bhi doctor ko result dikhta rahega
          console.error('Failed to auto-create patient record:', patientErr)
        }
      }
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