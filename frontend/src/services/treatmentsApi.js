import axios from 'axios'
import { readAuthUser } from '../shared/authStorage.js'

const API_BASE_URL = 'http://127.0.0.1:8000'

const treatmentApiClient = axios.create({
  baseURL: API_BASE_URL,
})

treatmentApiClient.interceptors.request.use((config) => {
  const authUser = readAuthUser()
  const token = authUser?.accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export async function fetchTreatments() {
  try {
    const response = await treatmentApiClient.get('/treatments')
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to fetch treatment records.'
    throw new Error(message)
  }
}

export async function fetchTreatmentSummary() {
  try {
    const response = await treatmentApiClient.get('/treatments/summary')
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to fetch treatment summary.'
    throw new Error(message)
  }
}

export async function createTreatment(treatmentData) {
  try {
    const response = await treatmentApiClient.post('/treatments', treatmentData)
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to create treatment record.'
    throw new Error(message)
  }
}