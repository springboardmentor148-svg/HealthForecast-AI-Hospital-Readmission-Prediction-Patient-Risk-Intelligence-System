import { apiRequest } from './client';
import { backendRoleToUiRole, uiRoleToBackendRole } from '../utils/auth';

export function mapUserToUi(user) {
  if (!user) return null;
  return {
    id: String(user.id),
    name: user.full_name,
    email: user.email,
    username: user.username,
    role: backendRoleToUiRole(user.role),
    dept: user.department || '—',
    phone: user.phone || '',
    status: user.status || 'inactive',
    isActive: user.is_active ?? true,
    lastLogin: user.last_login_at || 'Never',
    createdAt: user.created_at || null,
    initials: user.initials || 'U',
  };
}

export async function listUsers() {
  const response = await apiRequest('/users');
  return (response?.users || []).map(mapUserToUi);
}

export async function createUser(payload) {
  const backendPayload = {
    full_name: payload.name,
    email: payload.email,
    role: uiRoleToBackendRole(payload.role),
    department: payload.dept || 'General Medicine',
    phone: payload.phone || '',
    password: payload.password || 'Temporary123!',
  };
  const response = await apiRequest('/users', {
    method: 'POST',
    body: backendPayload,
  });
  return mapUserToUi(response?.user);
}

export async function updateUser(userId, payload) {
  const backendPayload = {};
  if (payload.name) backendPayload.full_name = payload.name;
  if (payload.email) backendPayload.email = payload.email;
  if (payload.role) backendPayload.role = uiRoleToBackendRole(payload.role);
  if (payload.dept) backendPayload.department = payload.dept;
  if (payload.phone) backendPayload.phone = payload.phone;
  if (payload.is_active !== undefined) backendPayload.is_active = payload.is_active;
  if (payload.password) backendPayload.password = payload.password;

  const response = await apiRequest(`/users/${userId}`, {
    method: 'PATCH',
    body: backendPayload,
  });
  return mapUserToUi(response?.user);
}

export async function getMyActivity() {
  const response = await apiRequest('/users/me/activity');
  return response?.activities || [];
}

