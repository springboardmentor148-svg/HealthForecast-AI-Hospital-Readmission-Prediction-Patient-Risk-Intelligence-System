import axios from 'axios'
import { readAuthUser } from '../shared/authStorage.js'

const API_BASE_URL = 'http://127.0.0.1:8000'

const userApiClient = axios.create({
  baseURL: API_BASE_URL,
})

userApiClient.interceptors.request.use((config) => {
  const authUser = readAuthUser()
  const token = authUser?.accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// GET logged-in user's profile + saved preferences
export async function fetchMyProfile() {
  try {
    const response = await userApiClient.get('/users/me')
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to load profile.'
    throw new Error(message)
  }
}

export async function updateMyProfile(profileData) {
  try {
    const response = await userApiClient.put('/users/me', profileData)
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to update profile.'
    throw new Error(message)
  }
}

// POST — change password. Body: { currentPassword, newPassword }
export async function changeMyPassword(passwordData) {
  try {
    const response = await userApiClient.post(
      '/users/me/change-password',
      passwordData
    )
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to change password.'
    throw new Error(message)
  }
}

// PUT — toggle 2FA. Body: { enabled: true/false }
export async function updateMyTwoFactor(enabled) {
  try {
    const response = await userApiClient.put('/users/me/two-factor', {
      enabled,
    })
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to update two-factor setting.'
    throw new Error(message)
  }
}

// PUT — notification checkbox preferences
export async function updateMyNotificationPreferences(preferences) {
  try {
    const response = await userApiClient.put(
      '/users/me/notification-preferences',
      preferences
    )
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      'Failed to update notification preferences.'
    throw new Error(message)
  }
}

// PUT — theme / compact layout preference
export async function updateMyAppearancePreferences(preferences) {
  try {
    const response = await userApiClient.put(
      '/users/me/appearance-preferences',
      preferences
    )
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      'Failed to update appearance preferences.'
    throw new Error(message)
  }
}

export async function fetchAllMyPreferences() {
  try {
    const response = await userApiClient.get('/users/me/all-preferences')
    return response.data
  } catch (error) {
    const message =
      error.response?.data?.detail || 'Failed to load preferences.'
    throw new Error(message)
  }
}

export default userApiClient