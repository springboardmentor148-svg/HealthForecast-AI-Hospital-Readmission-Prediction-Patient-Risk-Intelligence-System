export const ROLE_HOME = {
  Doctor: '/app/doctor/overview',
  'Hospital Administrator': '/app/hospital-admin/overview',
  'Healthcare Researcher': '/app/research/overview',
  'System Administrator': '/app/admin/overview',
}

export const ROLE_DEMO_USERS = {
  Doctor: {
    fullName: 'Dr. Sarah Mitchell',
    role: 'Doctor',
    hospital: 'Metro General Hospital',
  },
  'Hospital Administrator': {
    fullName: 'Michael Torres',
    role: 'Hospital Administrator',
    hospital: 'Metro General Hospital',
  },
  'Healthcare Researcher': {
    fullName: 'Dr. Elena Ruiz',
    role: 'Healthcare Researcher',
    hospital: 'Metro General Hospital',
  },
  'System Administrator': {
    fullName: 'Alex Carter',
    role: 'System Administrator',
    hospital: 'Metro General Hospital',
  },
}

export function getRoleHome(role) {
  return ROLE_HOME[role] || '/login'
}