import { apiRequest } from './client';

export async function getAnalyticsOverview() {
  return apiRequest('/analytics/overview');
}
