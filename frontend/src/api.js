// Centralized API access. All requests go through here so the auth
// token is attached consistently and errors are handled one way.
//
// Note on token storage: this stores the JWT in localStorage, which is
// the common, simple approach for a project like this. For a production
// deployment handling real patient data, an httpOnly cookie is the more
// secure option (it can't be read by JS, which blocks XSS token theft) —
// that requires coordinating cookie settings between frontend and
// backend, so it's a reasonable next step rather than a day-one need.

export const API_BASE = "http://localhost:8000";

const TOKEN_KEY = "readmission_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (!token) throw new Error("Not logged in.");
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(`Couldn't reach the API at ${API_BASE}. Is the backend running?`);
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const detail = errBody.detail;
    throw new Error(
      typeof detail === "string" ? detail : res.status === 401 ? "Session expired — please log in again." : `Request failed (${res.status})`
    );
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (email, password, fullName) =>
    request("/auth/register", { method: "POST", body: { email, password, full_name: fullName } }),

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),

  me: () => request("/auth/me", { auth: true }),

  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email } }),

  resetPassword: (token, newPassword) =>
    request("/auth/reset-password", { method: "POST", body: { token, new_password: newPassword } }),

  changePassword: (currentPassword, newPassword) =>
    request("/auth/change-password", {
      method: "POST",
      auth: true,
      body: { current_password: currentPassword, new_password: newPassword },
    }),

  options: () => request("/options"),

  predict: (payload) => request("/predict", { method: "POST", body: payload, auth: true }),

  myPredictions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/predictions/mine${qs ? `?${qs}` : ""}`, { auth: true });
  },

  allPredictions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/predictions/all${qs ? `?${qs}` : ""}`, { auth: true });
  },
};
