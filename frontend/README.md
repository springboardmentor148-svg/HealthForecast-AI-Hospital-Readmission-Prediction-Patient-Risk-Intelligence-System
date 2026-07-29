# React + Vite Dashboard - HealthForecast AI

This template provides a minimal setup to get React working in Vite with HMR and Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

---

## Development Architecture & RBAC Notes

### Mock Role Switcher (Temporary Development Tool)
- Located at the bottom of the navigation sidebar.
- **IMPORTANT**: This selector is a **TEMPORARY DEVELOPMENT/TESTING TOOL ONLY** used to verify role-based filters and guards on the frontend.
- In production (Phase 6 - Backend Integration), the user's role will be determined automatically from the authenticated session (e.g. JWT claims or session data from the backend authentication handlers) on login. Role assignments are managed by System Administrators at registration/creation time in the User Management system, not manually updated at runtime per session.
