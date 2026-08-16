import axios from 'axios'

const API_BASE_URL = 'http://127.0.0.1:8000'

export async function fetchPublicModelStats() {
  try {
    const response = await axios.get(`${API_BASE_URL}/public/model-stats`)
    return response.data
  } catch (error) {
    return { accuracy: null, version: null }
  }
}