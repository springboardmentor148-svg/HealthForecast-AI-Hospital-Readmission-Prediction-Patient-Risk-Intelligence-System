import { apiRequest } from './client';

export async function getTreatmentOverview() {
  return apiRequest('/treatments');
}

export async function updateTreatmentRecord(treatmentId, payload) {
  return apiRequest(`/treatments/${treatmentId}`, {
    method: 'PATCH',
    body: payload,
  });
}
