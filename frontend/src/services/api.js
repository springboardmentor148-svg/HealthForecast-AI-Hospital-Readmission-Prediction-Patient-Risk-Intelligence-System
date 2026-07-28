import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

const FEATURE_ORDER = [
  'race',
  'gender',
  'age',
  'admission_type_id',
  'discharge_disposition_id',
  'admission_source_id',
  'time_in_hospital',
  'payer_code',
  'medical_specialty',
  'num_lab_procedures',
  'num_procedures',
  'num_medications',
  'number_outpatient',
  'number_emergency',
  'number_inpatient',
  'diag_1',
  'diag_2',
  'diag_3',
  'number_diagnoses',
  'metformin',
  'repaglinide',
  'nateglinide',
  'chlorpropamide',
  'glimepiride',
  'glipizide',
  'glyburide',
  'tolbutamide',
  'pioglitazone',
  'rosiglitazone',
  'acarbose',
  'miglitol',
  'tolazamide',
  'insulin',
  'glyburide-metformin',
  'glipizide-metformin',
  'change',
  'diabetesMed',
]

export function buildPredictionFeatures(formData) {
  return FEATURE_ORDER.map((fieldName) => {
    const rawValue = formData[fieldName]

    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      return 0
    }

    return Number(rawValue)
  })
}

export async function predictReadmission(formData) {
  const features = buildPredictionFeatures(formData)

  if (features.length !== 37) {
    throw new Error('Prediction payload is malformed.')
  }

  try {
    const response = await apiClient.post('/predict', { features })
    return response.data
  } catch (error) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error)
    }

    throw new Error('Unable to reach the prediction service. Please try again.')
  }
}