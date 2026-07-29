import { getStoredToken } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

export async function apiRequest(path, { method = 'GET', body, token, auth = true } = {}) {
  const headers = {
    Accept: 'application/json',
  };

  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const effectiveToken = token ?? (auth ? getStoredToken() : null);
  if (auth && effectiveToken) {
    headers.Authorization = `Bearer ${effectiveToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      response.statusText ||
      'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}
