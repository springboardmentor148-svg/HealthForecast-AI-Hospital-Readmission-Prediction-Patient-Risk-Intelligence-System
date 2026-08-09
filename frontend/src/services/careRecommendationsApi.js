import axios from 'axios'
import { readAuthUser } from '../shared/authStorage.js'

const API_BASE_URL = 'http://127.0.0.1:8000'

const careApiClient = axios.create({
  baseURL: API_BASE_URL,
})

careApiClient.interceptors.request.use((config) => {
  const authUser = readAuthUser()
  const token = authUser?.accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export async function fetchCareRecommendations() {
  try {
    const response = await careApiClient.get('/care-recommendations')
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to fetch care recommendations.'
    throw new Error(message)
  }
}

export async function generateRecommendation(patientId) {
  try {
    const response = await careApiClient.post(`/care-recommendations/${patientId}/generate`)
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to generate recommendation.'
    throw new Error(message)
  }
}

export async function markRecommendationReviewed(patientId) {
  try {
    const response = await careApiClient.patch(`/care-recommendations/${patientId}/review`)
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to update recommendation status.'
    throw new Error(message)
  }
}