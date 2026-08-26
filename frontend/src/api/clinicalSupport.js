import { apiRequest } from './client';

export async function getClinicalSupport(patientId) {
  return apiRequest(`/clinical-support/${patientId}`);
}

export async function saveClinicalSupportDraft(patientId, draftNotes) {
  return apiRequest(`/clinical-support/${patientId}/draft`, {
    method: 'POST',
    body: JSON.stringify({ draft_notes: draftNotes }),
  });
}

export async function approveClinicalSupport(patientId) {
  return apiRequest(`/clinical-support/${patientId}/approve`, {
    method: 'POST',
  });
}
