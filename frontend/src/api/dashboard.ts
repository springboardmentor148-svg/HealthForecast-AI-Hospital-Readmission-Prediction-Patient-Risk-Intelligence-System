import apiClient from './client';
import type {
  DashboardSummary,
  RecentPrediction,
  ReadmissionStats,
  HospitalOverview,
} from '../types/api';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },

  getRecentPredictions: async (limit = 10): Promise<RecentPrediction[]> => {
    const res = await apiClient.get<RecentPrediction[]>('/dashboard/recent-predictions', {
      params: { limit },
    });
    return res.data;
  },

  getHighRiskPatients: async (limit = 20): Promise<RecentPrediction[]> => {
    const res = await apiClient.get<RecentPrediction[]>('/dashboard/high-risk-patients', {
      params: { limit },
    });
    return res.data;
  },

  getReadmissionStats: async (): Promise<ReadmissionStats> => {
    const res = await apiClient.get<ReadmissionStats>('/dashboard/readmission-statistics');
    return res.data;
  },

  getHospitalOverview: async (hospital_name?: string): Promise<HospitalOverview> => {
    const res = await apiClient.get<HospitalOverview>('/dashboard/hospital-overview', {
      params: hospital_name ? { hospital_name } : {},
    });
    return res.data;
  },
};
