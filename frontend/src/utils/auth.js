import { ROLES } from '../config/rbac';

export const AUTH_TOKEN_KEY = 'healthforecast_ai_access_token';

export const BACKEND_ROLE_TO_UI_ROLE = {
  doctor: ROLES.DOCTOR,
  hospital_administrator: ROLES.ADMINISTRATOR,
  healthcare_researcher: ROLES.RESEARCHER,
  system_administrator: ROLES.SYSTEM_ADMIN,
};

export const UI_ROLE_TO_BACKEND_ROLE = {
  [ROLES.DOCTOR]: 'doctor',
  [ROLES.ADMINISTRATOR]: 'hospital_administrator',
  [ROLES.RESEARCHER]: 'healthcare_researcher',
  [ROLES.SYSTEM_ADMIN]: 'system_administrator',
};

export function getStoredToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function backendRoleToUiRole(role) {
  return BACKEND_ROLE_TO_UI_ROLE[role] || ROLES.DOCTOR;
}

export function uiRoleToBackendRole(role) {
  return UI_ROLE_TO_BACKEND_ROLE[role] || 'doctor';
}

export function normalizeAuthUser(user) {
  if (!user) return null;
  return {
    ...user,
    role: backendRoleToUiRole(user.role),
  };
}

export function getUserInitials(fullName = '') {
  const parts = fullName
    .replace(/[^a-zA-Z\s.-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return 'U';

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}
