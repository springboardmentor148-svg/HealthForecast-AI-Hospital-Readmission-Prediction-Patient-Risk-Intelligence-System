// lib/auth.js

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token");
}

export function getUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const user = localStorage.getItem("user");

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    console.error("Invalid user data:", error);
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

export function logout() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "/login";
}