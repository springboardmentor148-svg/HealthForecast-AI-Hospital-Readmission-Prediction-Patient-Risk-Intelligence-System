import apiClient from './client';
import type {
  AgeDistributionPoint,
  MonthlyAnalyticsPoint,
  TrendPoint,
} from '../types/api';

export const analyticsApi = {
  getAgeDistribution: async (): Promise<AgeDistributionPoint[]> => {
    const res = await apiClient.get<AgeDistributionPoint[]>('/analytics/age-distribution');
    return res.data;
  },

  getMonthlyAnalytics: async (): Promise<MonthlyAnalyticsPoint[]> => {
    const res = await apiClient.get<MonthlyAnalyticsPoint[]>('/analytics/monthly');
    return res.data;
  },

  getReadmissionDistribution: async (): Promise<TrendPoint[]> => {
    const res = await apiClient.get<TrendPoint[]>('/analytics/readmission-distribution');
    return res.data;
  },

  getPatientTrends: async (): Promise<TrendPoint[]> => {
    const res = await apiClient.get<TrendPoint[]>('/analytics/patient-trends');
    return res.data;
  },
};
