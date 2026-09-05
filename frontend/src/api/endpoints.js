import api from './index';

export const authAPI = {
  login: (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  },
  register: (userData) => api.post('/api/auth/register', userData),
  getCurrentUser: () => api.get('/api/auth/me'),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }
};

export const patientAPI = {
  getAll: (params) => api.get('/api/patients', { params }),
  getById: (id) => api.get(`/api/patients/${id}`),
  create: (data) => api.post('/api/patients', data),
  update: (id, data) => api.put(`/api/patients/${id}`, data),
  delete: (id) => api.delete(`/api/patients/${id}`),
  predict: (id) => api.post(`/api/patients/${id}/predict`)
};

export const analyticsAPI = {
  getDashboard: () => api.get('/api/analytics/dashboard'),
  getReadmissionStats: (params) => api.get('/api/analytics/readmissions', { params }),
  getTreatmentEffectiveness: () => api.get('/api/analytics/treatments'),
  getFeatureImportance: () => api.get('/api/analytics/features'),
  getRiskDistribution: () => api.get('/api/analytics/risk-distribution')
};

export const reportAPI = {
  generateReport: (params) => api.post('/api/reports/generate', params),
  getReports: () => api.get('/api/reports')
};