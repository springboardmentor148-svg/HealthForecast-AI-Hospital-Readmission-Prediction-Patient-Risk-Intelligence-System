export const sidebarLabels = [
  'Dashboard',
  'Prediction',
  'Prediction History',
  'Analytics',
  'Reports',
  'Profile',
  'Settings',
]

export const dashboardMetrics = [
  { label: 'Total Patients', value: '2,184' },
  { label: 'Predictions Today', value: '126' },
  { label: 'High Risk Patients', value: '18' },
  { label: 'Low Risk Patients', value: '94' },
  { label: 'Model Accuracy', value: '92.4%' },
  { label: 'Average Confidence', value: '87.2%' },
]

export const recentPredictions = [
  {
    id: 'P-101',
    patientName: 'A. Johnson',
    prediction: 'Readmission',
    confidence: '91%',
    riskLevel: 'High',
    date: 'Today, 08:45 AM',
  },
  {
    id: 'P-102',
    patientName: 'M. Patel',
    prediction: 'No Readmission',
    confidence: '84%',
    riskLevel: 'Low',
    date: 'Today, 09:10 AM',
  },
  {
    id: 'P-103',
    patientName: 'S. Williams',
    prediction: 'Readmission',
    confidence: '79%',
    riskLevel: 'High',
    date: 'Today, 10:05 AM',
  },
  {
    id: 'P-104',
    patientName: 'R. Green',
    prediction: 'No Readmission',
    confidence: '88%',
    riskLevel: 'Low',
    date: 'Today, 10:42 AM',
  },
]

export const historyRows = [
  { patientId: 'P-201', patientName: 'Emma Stone', prediction: 'No Readmission', confidence: '88%', riskLevel: 'Low', date: '2026-07-21' },
  { patientId: 'P-202', patientName: 'Noah Miller', prediction: 'Readmission', confidence: '93%', riskLevel: 'High', date: '2026-07-21' },
  { patientId: 'P-203', patientName: 'Olivia Davis', prediction: 'No Readmission', confidence: '81%', riskLevel: 'Low', date: '2026-07-20' },
  { patientId: 'P-204', patientName: 'Liam Brown', prediction: 'Readmission', confidence: '76%', riskLevel: 'High', date: '2026-07-20' },
  { patientId: 'P-205', patientName: 'Sophia Wilson', prediction: 'No Readmission', confidence: '89%', riskLevel: 'Low', date: '2026-07-19' },
  { patientId: 'P-206', patientName: 'James Taylor', prediction: 'Readmission', confidence: '85%', riskLevel: 'High', date: '2026-07-18' },
]

export const analyticsSummary = [
  { label: 'Model Accuracy', value: '92.4%' },
  { label: 'Precision', value: '90.1%' },
  { label: 'Recall', value: '88.7%' },
  { label: 'F1 Score', value: '89.4%' },
  { label: 'ROC AUC', value: '94.6%' },
]

export const analyticsBars = [78, 88, 92, 86, 95, 90]

export const analyticsLine = [30, 38, 44, 53, 61, 68, 72, 80, 84, 89, 92, 94]

export const analyticsPie = [
  { label: 'High Risk', value: 24, color: '#dc2626' },
  { label: 'Low Risk', value: 76, color: '#2563eb' },
]

export const reportSummary = [
  { label: 'Monthly Predictions', value: '3,284' },
  { label: 'High Risk Cases', value: '248' },
  { label: 'Low Risk Cases', value: '3,036' },
  { label: 'Average Confidence', value: '87.2%' },
]

export const profile = {
  fullName: 'Dr. Sarah Mitchell',
  email: 'sarah.mitchell@healthforecastai.org',
  hospital: 'Metro General Hospital',
  department: 'Internal Medicine',
  role: 'Doctor',
  phone: '+1 (555) 204-8890',
}

export const dashboardQuickStats = [
  { title: 'Readmission rate', value: '12.4%', note: '+1.2% from last month' },
  { title: 'Pending reviews', value: '14', note: '3 urgent' },
  { title: 'Scheduled follow-ups', value: '42', note: 'This week' },
]
