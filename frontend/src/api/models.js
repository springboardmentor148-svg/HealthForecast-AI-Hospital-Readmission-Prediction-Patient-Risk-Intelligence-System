import { apiRequest } from './client';

export async function getModelSummary() {
  return apiRequest('/models/summary');
}

export async function getModelVersions() {
  const response = await apiRequest('/models/versions');
  return response?.versions || [];
}

