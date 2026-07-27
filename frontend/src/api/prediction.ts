import apiClient from './client';
import type {
  PredictionRequest,
  Prediction,
  PredictionListResponse,
} from '../types/api';

export const predictionApi = {
  predict: async (data: PredictionRequest): Promise<Prediction> => {
    const res = await apiClient.post<Prediction>('/predict', data);
    return res.data;
  },

  getPrediction: async (id: string): Promise<Prediction> => {
    const res = await apiClient.get<Prediction>(`/predictions/${id}`);
    return res.data;
  },

  listForPatient: async (
    patientId: string,
    page = 1,
    pageSize = 20
  ): Promise<PredictionListResponse> => {
    const res = await apiClient.get<PredictionListResponse>(
      `/patients/${patientId}/predictions`,
      { params: { page, page_size: pageSize } }
    );
    return res.data;
  },
};
