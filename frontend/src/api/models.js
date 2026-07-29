import { apiRequest } from './client';

export async function getModelSummary() {
  return apiRequest('/models/summary');
}
