import apiClient from './client';
import type {
  Report,
  ReportListResponse,
  ReportGenerateRequest,
} from '../types/api';

export const reportsApi = {
  generate: async (data: ReportGenerateRequest): Promise<Report> => {
    const res = await apiClient.post<Report>('/reports/generate', data);
    return res.data;
  },

  list: async (page = 1, pageSize = 20): Promise<ReportListResponse> => {
    const res = await apiClient.get<ReportListResponse>('/reports', {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/reports/${id}`);
  },

  getDownloadUrl: (id: string): string => `/api/v1/reports/${id}/download`,
};
