// Single source of truth for the backend API URL.
//
// In development, Vite falls back to http://127.0.0.1:8000 automatically.
// In Docker/production, set VITE_API_BASE_URL at build time (see the
// frontend Dockerfile / docker-compose.yml) to point at wherever the
// backend actually runs — never hardcode 127.0.0.1 anywhere else.

export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";