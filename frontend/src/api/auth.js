import { apiRequest } from './client';

export function loginRequest(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
}

export function registerRequest(payload) {
  return apiRequest('/auth/register', {
    method: 'POST',
    auth: false,
    body: payload,
  });
}

export function meRequest(token) {
  return apiRequest('/auth/me', {
    method: 'GET',
    token,
    auth: true,
  });
}

export function forgotPasswordRequest(email) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    auth: false,
    body: { email },
  });
}

export function updateMeRequest(payload) {
  const backendPayload = {};
  if (payload.full_name) backendPayload.full_name = payload.full_name;
  if (payload.department) backendPayload.department = payload.department;
  if (payload.phone) backendPayload.phone = payload.phone;
  if (payload.password) backendPayload.password = payload.password;

  return apiRequest('/users/me', {
    method: 'PATCH',
    body: backendPayload,
  });
}

