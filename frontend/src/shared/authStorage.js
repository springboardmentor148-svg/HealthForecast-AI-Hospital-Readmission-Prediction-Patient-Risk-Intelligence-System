const AUTH_STORAGE_KEY = 'healthforecastai-auth-user'

export function readAuthUser() {
  try {
    const value = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export function writeAuthUser(user) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
}

export function clearAuthUser() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}
