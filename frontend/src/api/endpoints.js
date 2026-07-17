import api from './index';

// Auth
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getCurrentUser: () => api.get('/api/auth/me'),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },
};

// Patients
export const patientAPI = {
  getAll: (params = {}) => api.get('/api/patients', { params }),
  getById: (id) => api.get(`/api/patients/${id}`),
  create: (data) => api.post('/api/patients', data),
  update: (id, data) => api.put(`/api/patients/${id}`, data),
  delete: (id) => api.delete(`/api/patients/${id}`),
};

// Predictions
export const predictionAPI = {
  predictRisk: (patientId) => api.post(`/api/predictions/risk/${patientId}`),
  getPredictions: (patientId) => api.get(`/api/predictions/${patientId}`),
  getForecast: (patientId) => api.get(`/api/predictions/forecast/${patientId}`),
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getReadmissionStats: (params) => api.get('/api/analytics/readmissions', { params }),
  getTreatmentEffectiveness: (params) => api.get('/api/analytics/treatments', { params }),
  getFeatureImportance: () => api.get('/api/analytics/features'),
  getRiskDistribution: () => api.get('/api/analytics/risk-distribution'),
};

// Reports
export const reportAPI = {
  generateReport: (params) => api.post('/api/reports/generate', params),
  downloadReport: (reportId) => api.get(`/api/reports/download/${reportId}`),
  getReports: () => api.get('/api/reports'),
};