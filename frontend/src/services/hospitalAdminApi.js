import axios from 'axios'
import { readAuthUser } from '../shared/authStorage.js'

const API_BASE_URL = 'http://127.0.0.1:8000'

const hospitalAdminApiClient = axios.create({
  baseURL: API_BASE_URL,
})

hospitalAdminApiClient.interceptors.request.use((config) => {
  const authUser = readAuthUser()
  const token = authUser?.accessToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export async function fetchHospitalOverview() {
  try {
    const response = await hospitalAdminApiClient.get('/hospital-admin/overview')
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch hospital overview.'
    throw new Error(message)
  }
}

export async function fetchHospitalProfile() {
  try {
    const response = await hospitalAdminApiClient.get('/hospital-admin/profile')
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch hospital profile.'
    throw new Error(message)
  }
}

export async function updateHospitalProfile(payload) {
  try {
    const response = await hospitalAdminApiClient.patch('/hospital-admin/profile', payload)
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to update hospital profile.'
    throw new Error(message)
  }
}

export async function fetchDepartments() {
  try {
    const response = await hospitalAdminApiClient.get('/hospital-admin/departments')
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch departments.'
    throw new Error(message)
  }
}

export async function fetchHospitalDoctors() {
  try {
    const response = await hospitalAdminApiClient.get('/hospital-admin/doctors')
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch doctors.'
    throw new Error(message)
  }
}

export async function createDepartment(payload) {
  try {
    const response = await hospitalAdminApiClient.post('/hospital-admin/departments', payload)
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to create department.'
    throw new Error(message)
  }
}

export async function updateDepartment(deptId, payload) {
  try {
    const response = await hospitalAdminApiClient.patch(`/hospital-admin/departments/${deptId}`, payload)
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to update department.'
    throw new Error(message)
  }
}

export async function removeDepartment(deptId) {
  try {
    const response = await hospitalAdminApiClient.delete(`/hospital-admin/departments/${deptId}`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to remove department.'
    throw new Error(message)
  }
}

export async function fetchHospitalOutcomes() {
  try {
    const response = await hospitalAdminApiClient.get('/hospital-admin/outcomes')
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch patient outcomes.'
    throw new Error(message)
  }
}

export async function fetchHospitalRiskForecast() {
  try {
    const response = await hospitalAdminApiClient.get('/hospital-admin/risk-forecast')
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch risk forecast.'
    throw new Error(message)
  }
}

export async function fetchTreatmentEffectiveness() {
  try {
    const response = await hospitalAdminApiClient.get('/hospital-admin/treatment-effectiveness')
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch treatment effectiveness.'
    throw new Error(message)
  }
}

export async function fetchPopulationHealth() {
  try {
    const response = await hospitalAdminApiClient.get('/hospital-admin/population-health')
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch population health data.'
    throw new Error(message)
  }
}

export async function fetchReports() {
  try {
    const response = await hospitalAdminApiClient.get('/hospital-admin/reports')
    return response.data.reports
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch reports.'
    throw new Error(message)
  }
}

export async function generateReport(type = 'Performance') {
  try {
    const response = await hospitalAdminApiClient.post('/hospital-admin/reports/generate', { type })
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to generate report.'
    throw new Error(message)
  }
}

export async function downloadReport(reportId, fallbackName) {
  try {
    const response = await hospitalAdminApiClient.get(`/hospital-admin/reports/${reportId}/download`, {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = fallbackName || `report-${reportId}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to download report.'
    throw new Error(message)
  }
}

export async function removeReport(reportId) {
  try {
    const response = await hospitalAdminApiClient.delete(`/hospital-admin/reports/${reportId}`)
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to remove report.'
    throw new Error(message)
  }
}

export async function updateMyProfile(payload) {
  try {
    const response = await hospitalAdminApiClient.put('/users/me', payload)
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to update profile.'
    throw new Error(message)
  }
}

export async function changeMyPassword(currentPassword, newPassword) {
  try {
    const response = await hospitalAdminApiClient.post('/users/me/change-password', {
      currentPassword,
      newPassword,
    })
    return response.data
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to change password.'
    throw new Error(message)
  }
}

export async function getPreference(key) {
  try {
    const response = await hospitalAdminApiClient.get(`/users/me/preferences/${key}`)
    return response.data.value
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to fetch preference.'
    throw new Error(message)
  }
}

export async function setPreference(key, value) {
  try {
    const response = await hospitalAdminApiClient.put(`/users/me/preferences/${key}`, { value })
    return response.data.value
  } catch (error) {
    const message = error.response?.data?.detail || 'Failed to save preference.'
    throw new Error(message)
  }
}