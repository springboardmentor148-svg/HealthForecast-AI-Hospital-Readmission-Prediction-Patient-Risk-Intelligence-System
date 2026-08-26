# HealthForecast AI - Mock Data Removal Plan

This document outlines the systematic plan to eliminate or replace the remaining inappropriate mock, demo, or hardcoded application data in HealthForecast AI. It establishes clear classifications, maps API/service/database layers, and provides a safe implementation roadmap.

---

## 1. Executive Summary

A codebase-wide audit of HealthForecast AI confirms that the system's core analytical flows (Dashboard summary counts, Healthcare Analytics scoped views, Treatment effectiveness statistics, Patient profiles, and Predictions history) are fully integrated with PostgreSQL and live machine learning inference. 

To achieve full production readiness, we must eliminate two minor hardcoded frontend elements, establish a persistent user activity logger, and document the cleanup path for test/seed records. This plan categorizes all elements, maps their data flows, and details the sequencing of changes.

---

## 2. Verified Remaining Mock/Demo Data

The following table catalogs all identified mock, hardcoded, or demo data elements requiring action.

| ID | Location | Item | Category | Severity | Current Source | Intended Source | Replacement Needed |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M-01** | `ProfilePage.jsx` (L580-620) | Recent Account Activity Timeline | **A. MUST BE REPLACED** | Medium | Hardcoded React JSX items detailing mock patient #82014. | `GET /api/v1/users/me/activity` endpoint querying PostgreSQL. | Yes (Backend activity tracking service, new API, and UI integration). |
| **M-02** | `PredictionsHistoryPage.jsx` (L134-137) | Model options filter dropdown | **A. MUST BE REPLACED** | Low | Hardcoded option array: `v1.2`. | Query unique model versions from `prediction_history` table. | Yes (New unique model versions lookup backend helper, API integration). |
| **T-01** | `backend/tests/` | Test user/patient credentials and emails | **D. TEST/E2E DATA** | Low | Hardcoded emails (`test_user@example.com`, `admin@example.com`) in test scripts. | Static test-runner parameters. | No (Keep as-is; these are isolated from production). |
| **S-01** | PostgreSQL Database | Seed users & imported patient CSV | **E. DEMO/SEED DATA** | Medium | Manually registered users and imported patient CSV files. | Clean database. | Yes (Cleanup/data purging before production deployment). |

---

## 3. Fully Real / No Action Required

The following major features are verified as genuinely database-backed or dynamically model-driven:

1. **Dashboard Overview Stats** (`GET /api/v1/analytics/dashboard`): Derives monitored patient counts, risk distribution splits, average probabilities, and recent high-risk listings via live SQLAlchemy queries over `patients` and `predictions` tables.
2. **Dashboard Activity Feed** (`GET /api/v1/analytics/dashboard`): Formatted dynamically by combining the 5 most recent predictions and 3 most recent patient profile updates in PostgreSQL.
3. **Analytics Scoped Charts** (`GET /api/v1/analytics/overview`): Grouping of department distributions and stay benchmarks is computed dynamically using patient parameters, doctor departments, and treatment success columns.
4. **Treatment Effectiveness stats** (`GET /api/v1/treatments`): Overall success rate, recovery stay average, and confidence rates are aggregated live using SQL average functions (`func.avg()`) over the `treatment_effectiveness` table.
5. **Patient Directory Registry** (`GET /api/v1/patients`): CRUD options, filters, text searches, and detail tabs map directly to the PostgreSQL `Patient` schema.
6. **AI Predictor & SHAP Explainers** (`POST /api/v1/predictions/run`): Integrates with `KernelExplainer` using actual stacked ensemble probability scores and feature alignment, saving metrics directly to `predictions` and `prediction_history` tables.

---

## 4. Intentional UI-Only Features

These features represent acceptable frontend-only interactive states and do **NOT** require backend/database integration:

1. **Model Version Selection** (`ModelManagementPage.jsx`): The "Set Active" button simulates version switching via local state updates and a timeout toast. The backend runs a static stacking ensemble model loaded from `models/weighted_stacking_model.pkl` at start.
2. **Profile Settings Preferences** (`ProfilePage.jsx`): Theme switches (system, light, dark) and language selectors are managed in local browser memory.
3. **Change Photo** (`ProfilePage.jsx`): Renders a placeholder info toast ("Photo uploading is currently disabled") to indicate that file upload mechanisms are currently inactive.
4. **Download Import Template** (`PatientsPage.jsx`): Generates a sample CSV template client-side for clinician reference.

---

## 5. Test/E2E/Demo Data

The following test, E2E, and demo data elements are present in the codebase:

1. **Test User Credentials** (e.g. `doctor@example.com` / `password123`):
   * *Purpose*: Used for automated testing and authentication verification.
   * *Safety*: Safe to remain in `backend/tests/` as they are isolated in-memory.
   * *Production Database*: Does not exist in production.
   * *Recommended Cleanup*: None needed. Keep for regression tests.
2. **Demo Patient / User Seeds**:
   * *Purpose*: Initial database entries used to demonstrate the system (e.g., patient metrics, charts, activity logs).
   * *Safety*: Must be cleared before production launch.
   * *Production Database*: Active if migrated/seeded from initial demo environments.
   * *Recommended Cleanup*: Run the dedicated script `backend/scripts/clear_demo_data.py` to purge demo rows from tables while preserving system configurations.

---

## 6. Replacement Architecture

Data-flow target architectures for Category A items:

### Recent Account Activity Timeline (M-01)
* **Current**:
  `React Frontend (ProfilePage.jsx) → Hardcoded UI timeline array`
* **Target**:
  `React Frontend (ProfilePage.jsx) → API: GET /api/v1/users/me/activity → Service: list_user_activity() → SQLAlchemy query → PostgreSQL Table: activity_logs`

### Model Options Filter Dropdown (M-02)
* **Current**:
  `React Frontend (PredictionsHistoryPage.jsx) → Hardcoded array ['v1.2']`
* **Target**:
  `React Frontend (PredictionsHistoryPage.jsx) → API: GET /api/v1/models/versions → Service: get_model_versions() → SQLAlchemy query → PostgreSQL Table: prediction_history.model_version`

---

## 7. Required Changes

### Frontend
1. **`ProfilePage.jsx`**:
   * Update component to fetch the activity list from `/api/v1/users/me/activity` on mount.
   * Map the JSON response to render the activity timeline dynamically.
2. **`PredictionsHistoryPage.jsx`**:
   * Update component to fetch available model versions from `/api/v1/models/versions`.
   * Populate the model filter dropdown dynamically.

### Backend
1. **User Activity Logging System**:
   * Add a backend utility helper `log_user_activity(user_id, action, target_type, target_id, metadata)` that inserts immutable logs into the `ActivityLog` model.
   * Integrate this helper across patient CRUD, prediction triggers, and treatment completions.
2. **API Routes**:
   * Implement `GET /api/v1/users/me/activity` returning the current user's activity logs.
   * Implement `GET /api/v1/models/versions` returning unique model versions.

### Database
* **Immersion Check**: Database tables `activity_logs` and `prediction_history` are already defined in the Alembic schema. No database migrations are required.

### Data Cleanup
* Deploying to production will require running `python backend/scripts/clear_demo_data.py` to ensure a clean database slate.

---

## 8. Dependency Order

To implement the mock removals safely:

1. **Phase 1: Model Versions Dropdown** (Low Risk):
   * Create the unique version lookup backend endpoint.
   * Connect the frontend dropdown.
2. **Phase 2: Activity Logger & API** (Medium Risk):
   * Implement the user activity logging service on the backend.
   * Add hooks to write logs during patient CRUD, prediction runs, and treatment updates.
   * Expose the GET activity route.
3. **Phase 3: Activity Timeline UI** (Low Risk):
   * Connect the profile settings timeline to the newly exposed activity endpoint.

---

## 9. Risk Assessment

1. **API Regressions**: Adding user activity logs introduces a write step to patient and prediction endpoints. Wrap log writes in try/except blocks to prevent logging errors from failing primary clinical workflows.
2. **Database Risks**: High prediction/ingestion volume will cause the `activity_logs` table to grow rapidly. Keep metadata small and index `user_id` and `created_at` fields.
3. **UI Regressions**: Handled by falling back to empty timeline states if the backend activity log is empty.
4. **Authentication Risks**: Security scoping is locked to the authenticated token (`get_jwt_identity()`) to ensure users can only view their own activity logs.

---

## 10. Production Readiness Gap

Before this system is production-ready, the following checklist must be completed:
- `[ ]` Replace hardcoded recent activity timeline with live PostgreSQL activity logs.
- `[ ]` Populate model version search filters dynamically from database prediction records.
- `[ ]` Execute `clear_demo_data.py` on the target production database instance to purge setup cohorts.
- `[ ]` Establish secure production environment secrets for `SECRET_KEY` and `JWT_SECRET_KEY` (removing compose defaults).

---

## 11. Recommended Next Implementation Phase

We recommend implementing the **Model Versions Dropdown (M-02)** first. This is a low-risk, self-contained endpoint integration that validates dynamic data flow from prediction records without introducing new write logic to the core database tables.
