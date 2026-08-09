import axios from 'axios'
import { readAuthUser } from '../shared/authStorage.js'

const API_BASE_URL = 'http://127.0.0.1:8000'

const adminApiClient = axios.create({
  baseURL: API_BASE_URL,
})

adminApiClient.interceptors.request.use((config) => {
  const authUser = readAuthUser()
  const token = authUser?.accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export async function fetchAdminUsers(role) {
  try {
    const response = await adminApiClient.get('/admin/users', {
      params: role && role !== 'All' ? { role } : {},
    })
    return response.data.users
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch users.'
    throw new Error(message)
  }
}

export async function inviteAdminUser(payload) {
  try {
    const response = await adminApiClient.post('/admin/users/invite', payload)
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to invite user.'
    throw new Error(message)
  }
}

export async function toggleUserActive(userId) {
  try {
    const response = await adminApiClient.patch(`/admin/users/${userId}/toggle-active`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to update user status.'
    throw new Error(message)
  }
}

export async function updateUserRole(userId, newRole) {
  try {
    const response = await adminApiClient.patch(`/admin/users/${userId}/role`, {
      userRole: newRole,
    })
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to update user role.'
    throw new Error(message)
  }
}

export async function editAdminUser(userId, payload) {
  try {
    const response = await adminApiClient.patch(`/admin/users/${userId}`, payload)
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to update user details.'
    throw new Error(message)
  }
}

export async function removeAdminUser(userId) {
  try {
    const response = await adminApiClient.delete(`/admin/users/${userId}`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to remove user.'
    throw new Error(message)
  }
}

export async function fetchAdminOverview() {
  try {
    const response = await adminApiClient.get('/admin/overview')
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch overview stats.'
    throw new Error(message)
  }
}

export async function fetchDatasets() {
  try {
    const response = await adminApiClient.get('/admin/datasets')
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch datasets.'
    throw new Error(message)
  }
}

export async function uploadDataset({ name, notes, file }) {
  try {
    const formData = new FormData()
    formData.append('name', name)
    if (notes) formData.append('notes', notes)
    formData.append('file', file)

    const response = await adminApiClient.post('/admin/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to upload dataset.'
    throw new Error(message)
  }
}

export async function downloadDataset(datasetId, fallbackName) {
  try {
    const response = await adminApiClient.get(`/admin/datasets/${datasetId}/download`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = fallbackName || 'dataset'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to download dataset.'
    throw new Error(message)
  }
}

export async function removeDataset(datasetId) {
  try {
    const response = await adminApiClient.delete(`/admin/datasets/${datasetId}`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to remove dataset.'
    throw new Error(message)
  }
}

export async function fetchModels() {
  try {
    const response = await adminApiClient.get('/admin/models')
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch models.'
    throw new Error(message)
  }
}

export async function retrainModel(trainedOn) {
  try {
    const response = await adminApiClient.post(
      '/admin/models/retrain',
      { trainedOn },
      { timeout: 1800000 }
    )
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to retrain model.'
    throw new Error(message)
  }
}

// ---------- Settings ----------
export async function fetchPlatformConfig() {
  const response = await adminApiClient.get('/admin/settings/platform')
  return response.data
}
export async function updatePlatformConfig(payload) {
  const response = await adminApiClient.put('/admin/settings/platform', payload)
  return response.data
}

export async function fetchAlertThresholds() {
  const response = await adminApiClient.get('/admin/settings/alerts')
  return response.data
}
export async function updateAlertThresholds(payload) {
  const response = await adminApiClient.put('/admin/settings/alerts', payload)
  return response.data
}

export async function fetchNotificationPrefs() {
  const response = await adminApiClient.get('/admin/settings/notifications')
  return response.data
}
export async function updateNotificationPrefs(payload) {
  const response = await adminApiClient.put('/admin/settings/notifications', payload)
  return response.data
}

export async function fetchAuditConfig() {
  const response = await adminApiClient.get('/admin/settings/audit-config')
  return response.data
}
export async function updateAuditConfig(payload) {
  const response = await adminApiClient.put('/admin/settings/audit-config', payload)
  return response.data
}
export async function exportAuditLogsNow() {
  const response = await adminApiClient.get('/admin/settings/audit-export', { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = 'audit-logs.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function fetchPrivacyConfig() {
  const response = await adminApiClient.get('/admin/settings/privacy')
  return response.data
}
export async function updatePrivacyConfig(payload) {
  const response = await adminApiClient.put('/admin/settings/privacy', payload)
  return response.data
}

export async function fetchAppearanceConfig() {
  const response = await adminApiClient.get('/admin/settings/appearance')
  return response.data
}
export async function updateAppearanceConfig(payload) {
  const response = await adminApiClient.put('/admin/settings/appearance', payload)
  return response.data
}

export async function fetchRolePermissions() {
  const response = await adminApiClient.get('/admin/settings/roles-permissions')
  return response.data.permissions
}
export async function updateRolePermissions(permissions) {
  const response = await adminApiClient.put('/admin/settings/roles-permissions', { permissions })
  return response.data.permissions
}

export async function fetchTwoFactor() {
  const response = await adminApiClient.get('/admin/settings/security/2fa')
  return response.data.enabled
}
export async function updateTwoFactor(enabled) {
  const response = await adminApiClient.put('/admin/settings/security/2fa', { enabled })
  return response.data.enabled
}

export async function changePassword(currentPassword, newPassword) {
  try {
    const response = await adminApiClient.post('/admin/settings/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to change password.'
    throw new Error(message)
  }
}

export async function fetchAuditLogs() {
  try {
    const response = await adminApiClient.get('/admin/audit-logs')
    return response.data.logs
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch audit logs.'
    throw new Error(message)
  }
}