import axios from 'axios'
import { readAuthUser } from '../shared/authStorage.js'

const API_BASE_URL = 'http://127.0.0.1:8000'

const dashboardApiClient = axios.create({
  baseURL: API_BASE_URL,
})

dashboardApiClient.interceptors.request.use((config) => {
  const authUser = readAuthUser()
  const token = authUser?.accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export async function fetchDoctorDashboardStats() {
  try {
    const response = await dashboardApiClient.get('/doctor/dashboard-stats')
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to fetch dashboard stats.'
    throw new Error(message)
  }
}