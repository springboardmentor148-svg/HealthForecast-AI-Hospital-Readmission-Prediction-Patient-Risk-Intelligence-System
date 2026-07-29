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
