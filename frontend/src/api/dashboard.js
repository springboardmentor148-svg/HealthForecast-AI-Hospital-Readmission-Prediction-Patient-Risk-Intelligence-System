import { apiRequest } from './client';

export async function getDashboardSummary() {
  return apiRequest('/analytics/dashboard');
}

