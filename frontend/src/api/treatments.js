import { apiRequest } from './client';

export async function getTreatmentOverview() {
  return apiRequest('/treatments');
}
