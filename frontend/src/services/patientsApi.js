import axios from 'axios'
import { readAuthUser } from '../shared/authStorage.js'

const API_BASE_URL = 'http://127.0.0.1:8000'

const patientApiClient = axios.create({
  baseURL: API_BASE_URL,
})

// Har request ke saath JWT token automatically attach karo
patientApiClient.interceptors.request.use((config) => {
  const authUser = readAuthUser()
  const token = authUser?.accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export async function fetchPatients() {
  try {
    const response = await patientApiClient.get('/patients')
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to fetch patients.'
    throw new Error(message)
  }
}

export async function fetchPatientById(patientDbId) {
  try {
    const response = await patientApiClient.get(`/patients/${patientDbId}`)
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to fetch patient details.'
    throw new Error(message)
  }
}

export async function createPatient(patientData) {
  try {
    const response = await patientApiClient.post('/patients', patientData)
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to create patient.'
    throw new Error(message)
  }
}