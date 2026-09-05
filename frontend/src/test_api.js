import api from './api';

// Test health endpoint
api.get('/api/health')
  .then(res => console.log('✅ API Health:', res.data))
  .catch(err => console.error('❌ API Error:', err));

// Test login
authAPI.login({ username: 'admin', password: 'admin123' })
  .then(res => console.log('✅ Login:', res.data))
  .catch(err => console.error('❌ Login Error:', err));

// Test patients
patientAPI.getAll()
  .then(res => console.log('✅ Patients:', res.data))
  .catch(err => console.error('❌ Patients Error:', err));

// Test dashboard
analyticsAPI.getDashboard()
  .then(res => console.log('✅ Dashboard:', res.data))
  .catch(err => console.error('❌ Dashboard Error:', err));