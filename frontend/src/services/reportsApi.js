import axios from 'axios'
import { readAuthUser } from '../shared/authStorage.js'

const API_BASE_URL = 'http://127.0.0.1:8000'

const reportsApiClient = axios.create({
  baseURL: API_BASE_URL,
})

reportsApiClient.interceptors.request.use((config) => {
  const authUser = readAuthUser()
  const token = authUser?.accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export async function fetchReportSummary() {
  try {
    const response = await reportsApiClient.get('/reports/summary')
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to fetch report summary.'
    throw new Error(message)
  }
}
export async function fetchHighRiskPatients() {
  try {
    const response = await reportsApiClient.get('/reports/high-risk-patients')
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch high risk patients.')
  }
}

export async function fetchLowRiskPatients() {
  try {
    const response = await reportsApiClient.get('/reports/low-risk-patients')
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch low risk patients.')
  }
}

export async function fetchMonthlyStats() {
  try {
    const response = await reportsApiClient.get('/reports/monthly-stats')
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch monthly stats.')
  }
}