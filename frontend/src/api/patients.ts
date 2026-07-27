import apiClient from './client';
import type { Patient, PatientListResponse, PatientFilters } from '../types/api';

export const patientsApi = {
  list: async (filters: PatientFilters = {}): Promise<PatientListResponse> => {
    const res = await apiClient.get<PatientListResponse>('/patients', { params: filters });
    return res.data;
  },

  get: async (id: string): Promise<Patient> => {
    const res = await apiClient.get<Patient>(`/patients/${id}`);
    return res.data;
  },

  create: async (data: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> => {
    const res = await apiClient.post<Patient>('/patients', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Patient>): Promise<Patient> => {
    const res = await apiClient.put<Patient>(`/patients/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/patients/${id}`);
  },
};
