import axios from 'axios'
import { readAuthUser } from '../shared/authStorage.js'

const API_BASE_URL = 'http://127.0.0.1:8000'

const notificationsApiClient = axios.create({
  baseURL: API_BASE_URL,
})

notificationsApiClient.interceptors.request.use((config) => {
  const authUser = readAuthUser()
  const token = authUser?.accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export async function fetchDoctorNotifications() {
  try {
    const response = await notificationsApiClient.get('/notifications/doctor')
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to fetch notifications.'
    throw new Error(message)
  }
}