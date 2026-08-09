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
    department: 'Cardiology',
    phone: '+91 98765 43210',
  },
  'Hospital Administrator': {
    fullName: 'Michael Torres',
    role: 'Hospital Administrator',
    hospital: 'Metro General Hospital',
    department: 'Hospital Administration',
    phone: '+91 91234 56780',
  },
  'Healthcare Researcher': {
    fullName: 'Dr. Elena Ruiz',
    role: 'Healthcare Researcher',
    hospital: 'Metro General Hospital',
    department: 'Clinical Research',
    phone: '+91 99887 76655',
  },
  'System Administrator': {
    fullName: 'Alex Carter',
    role: 'System Administrator',
    hospital: 'Metro General Hospital',
    department: 'IT & Systems',
    phone: '+91 90000 11122',
  },
}

export function getRoleHome(role) {
  return ROLE_HOME[role] || '/login'
}