import axios from 'axios'
import { readAuthUser } from '../shared/authStorage.js'

const API_BASE_URL = 'http://127.0.0.1:8000'

const predictionApiClient = axios.create({
  baseURL: API_BASE_URL,
})

// Har request ke saath JWT token automatically attach karo
predictionApiClient.interceptors.request.use((config) => {
  const authUser = readAuthUser()
  const token = authUser?.accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export async function savePrediction(predictionData) {
  try {
    const response = await predictionApiClient.post('/predictions', predictionData)
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to save prediction. Please try again.'
    throw new Error(message)
  }
}

export async function fetchPredictionHistory() {
  try {
    const response = await predictionApiClient.get('/predictions')
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to fetch prediction history.'
    throw new Error(message)
  }
}