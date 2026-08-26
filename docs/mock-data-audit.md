# HealthForecast AI - Mock Data Audit Report

This report provides a detailed, feature-by-feature codebase audit of HealthForecast AI to locate and catalog mock, hardcoded, or demo data sources. It maps user-facing features to their backend service modules and database schemas, distinguishing between **database-backed data**, **deterministic clinical rules**, and **intentional UI-only interactive mock behavior**.

---

## 1. Executive Summary

A comprehensive codebase audit reveals that the backend and frontend are already highly integrated with PostgreSQL. Most statistics, feeds, lists, and metrics are calculated dynamically via SQLAlchemy ORM queries over live patient, prediction, and treatment records. 

There are no hardcoded static database mocks on the backend. However, several specific areas feature **deterministic clinical rules** (modeled as clinical support logic) or **intentional UI-only behaviors** that operate in local memory without database updates. This report catalogues these boundaries to guide future developer phases.

---

## 2. Core Conceptual Distinctions

To ensure accurate engineering planning, data elements in HealthForecast AI are classified into three distinct categories:

1. **Fully Real (Database-Backed)**: Data elements retrieved from PostgreSQL tables via Flask APIs and service layers, reflecting the true state of patient profiles, prediction histories, and logged treatment outcomes.
2. **Clinical Rules (Deterministic Calculation)**: Non-ML clinical advice, risk deconditioning thresholds, or treatment outcome forecasts computed dynamically in the backend using deterministic algorithms based on patient inputs.
3. **Intentional UI-Only (Frontend Mock)**: Interactive elements styled to simulate backend features in local component states without writing to, or fetching from, database schemas.

---

## 3. Feature-by-Feature Detailed Audit

### A. Dashboard View (`DashboardPage.jsx`)
* **UI Features**: Total Patients Monitored count, High Readmission Risk count, Avg Risk Score, Admissions by Specialty donut chart, Readmission Risk Distribution donut chart, Recent High-Risk Patients registry table, and System Activity Feed.
* **API Endpoint**: `GET /api/v1/analytics/dashboard`
* **Backend Service / Query Layer**: `build_dashboard_summary()` in [insights_service.py](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/backend/app/services/insights_service.py#L233-L263).
* **Database Tables & Columns**:
  * `patients`: `id`, `readmission_probability`, `risk_band` (enums: `low`, `moderate`, `high`, `critical`).
  * `predictions`: `id`, `predicted_at`, `predicted_risk_band`, `predicted_readmission_probability`.
* **State Mapping**: **100% Real (Database-Backed)**. All dashboard summaries, distributions, and list items are computed dynamically via SQL aggregates of patient profiles and predictions in PostgreSQL. The activity feed merges predictions and patient updates sorted by timestamp.

### B. Healthcare Analytics View (`AnalyticsPage.jsx`)
* **UI Features**: Role-scoped panels for Doctors, Researchers, and Executives. Includes active clinician cohort sizes, high-risk counts, glycemic index distribution bars, population readmission trends, average stay durations, and departmental performance benchmarks.
* **API Endpoint**: `GET /api/v1/analytics/overview`
* **Backend Service / Query Layer**: `build_analytics_overview()` calling `_view_for_role()` in [insights_service.py](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/backend/app/services/insights_service.py#L369-L380).
* **Database Tables & Columns**:
  * `patients`: `assigned_doctor_id`, `time_in_hospital`, `readmission_probability`, `risk_band`.
  * `predictions`: `predicted_at`, `predicted_readmission_probability`, `predicted_risk_band`.
  * `users` (as doctors): `id`, `department`.
  * `treatment_effectiveness`: `status`, `effectiveness_level`.
* **State Mapping**: **100% Real (Database-Backed)**.
  * **Doctor View** filters lists and trends by the logged-in user's doctor ID.
  * **Researcher View** anonymizes patient identifying fields and categorizes risk bands.
  * **Executive View** compiles hospital-wide stay lengths, department admission ratios, and benchmarks (average readmission rates, stay counts, and improvement indices) computed dynamically from treatment outcomes.
  * *Note on Researcher Trend*: It slices `predictions[:3]` to build a simple timeline. While database-backed, this is a simplified view of the temporal trend.

### C. Clinical Decision Support (`ClinicalSupportPage.jsx`)
* **UI Features**: Primary Care Recommendations (bullet lists), Follow-Up Planning table (Routine, Urgent, Optional schedules), Risk Mitigation Suggestions (Polypharmacy/Deconditioning alerts), and Clinician Draft Notes textarea with approval logs.
* **API Endpoints**:
  * Fetch: `GET /api/v1/clinical-support/<patient_id>`
  * Draft: `POST /api/v1/clinical-support/<patient_id>/draft`
  * Approve: `POST /api/v1/clinical-support/<patient_id>/approve`
* **Backend Service / Query Layer**: `build_clinical_support()` and `create_treatment_from_plan()` in [insights_service.py](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/backend/app/services/insights_service.py#L502-L634).
* **Database Tables & Columns**:
  * `patients`: `id`, `risk_band`, `time_in_hospital`.
  * `clinical_support_plans`: `draft_notes`, `is_approved`, `approved_by`, `approved_at`, `updated_by`, `updated_at`, `treatment_name`.
  * `treatment_effectiveness`: `patient_id`, `treatment_name`, `start_date`, `status`, `notes`.
* **State Mapping**: **Mixed (Database-Backed & Clinical Rules)**.
  * **Database-Backed**: Draft notes, approval logs, updater fields, and target treatments are persisted in PostgreSQL.
  * **Clinical Rules**: Recommendations (e.g., case management referrals) and risk mitigations are generated programmatically based on patient thresholds:
    * *Deconditioning warning*: Triggered if `time_in_hospital > 5`.
    * *Polypharmacy warning*: Triggered if patient medications count $\ge 4$.
    * *Urgency timeframe*: Determined by patient risk bands.

### D. Treatment Effectiveness Reports (`TreatmentEffectivenessPage.jsx`)
* **UI Features**: Avg Success Rate stat, Avg Recovery Duration stat, AI Confidence stat, Active Ongoing Treatments table, Recovery Analysis line chart, Medication Efficacy bar chart, and Outcome Evaluation comparative registry.
* **API Endpoints**:
  * List: `GET /api/v1/treatments`
  * Update: `PATCH /api/v1/treatments/<id>`
* **Backend Service / Query Layer**: `build_treatment_overview()` in [insights_service.py](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/backend/app/services/insights_service.py#L392-L501) and `update_treatment()` in [treatments.py](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/backend/app/routes/treatments.py#L185-L270).
* **Database Tables & Columns**:
  * `treatment_effectiveness`: `id`, `patient_id`, `treatment_name`, `start_date`, `end_date`, `outcome_score`, `effectiveness_level`, `notes`, `status`, `predicted_treatment_effectiveness`, `predicted_recovery_days`, `treatment_confidence`.
* **State Mapping**: **100% Real (Database-Backed)**. All success rates, recovery durations, and confidence indexes are aggregated directly via SQLAlchemy `func.avg()` queries from the database. Charts and tabular records display actual treatment logs.

### E. Patient Directory & Profile (`PatientsPage.jsx`, `PatientDetailPage.jsx`)
* **UI Features**: Searchable, filtered patient registry, CSV import/validate modals, CRUD buttons, patient clinical history charts, and active treatments summary.
* **API Endpoints**:
  * Directory: `GET /api/v1/patients`
  * Details: `GET /api/v1/patients/<id>`
  * Create/Update/Delete: `POST / PUT / DELETE /api/v1/patients`
  * Batch Predictions: `POST /api/v1/predictions/run-pending` and `run-all`
* **Backend Service / Query Layer**: `list_patients()`, `create_patient()`, `update_patient()`, and `delete_patient()` in [patient_service.py](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/backend/app/services/patient_service.py).
* **Database Tables & Columns**:
  * `patients`: `id`, `first_name`, `last_name`, `age_at_admission`, `gender`, `admission_type`, `primary_diagnosis`, `time_in_hospital`, `lab_procedures_count`, `prior_diagnoses_count`, `medications`, `readmission_probability`, `risk_band`.
* **State Mapping**: **100% Real (Database-Backed)**. All clinical lists, profiles, search filters, and CRUD modifications interface directly with PostgreSQL. Batch prediction runs trigger live inference for the designated patient sub-cohort.

### F. Prediction History (`PredictionsHistoryPage.jsx`)
* **UI Features**: Server-side paginated list of past predictions, text search, date range selectors, sorting options, and risk band drop-downs.
* **API Endpoint**: `GET /api/v1/predictions`
* **Backend Service / Query Layer**: `list_prediction_history()` in [prediction_service.py](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/backend/app/services/prediction_service.py).
* **Database Tables & Columns**:
  * `prediction_history`: `id`, `patient_id`, `risk_score`, `risk_band`, `confidence`, `threshold_used`, `created_at`, `model_version`.
  * `patients`: `first_name`, `last_name`.
* **State Mapping**: **100% Real (Database-Backed)**. Employs server-side database pagination and dynamic sorting over `PredictionHistory` records.

### G. AI Model Management (`ModelManagementPage.jsx`)
* **UI Features**: Active model info box, evaluation metric cards (Accuracy, AUC, Precision, Recall), system uptime, predictions served today, response latency, performance trend chart, and model version registry.
* **API Endpoint**: `GET /api/v1/models/summary`
* **Backend Service / Query Layer**: `build_model_summary()` in [insights_service.py](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/backend/app/services/insights_service.py#L637-L754).
* **Database Tables & Columns**:
  * `predictions`: `model_name`, `model_version`, `predicted_at`, `actual_readmitted`, `predicted_readmission_probability`.
* **State Mapping**: **Mixed (Real & Intentional UI-only Mocks)**.
  * **Real**: Uptime index, predictions served counts, and latency markers are loaded dynamically. Metric stat cards load from the active model metadata file `models/model_info.json`. If patient readmission outcomes are logged in PostgreSQL (`actual_readmitted is not None`), metrics recalculate to show live performance.
  * **UI-only Mock**: The **"Set Active"** button is mocked in the frontend using local state updates and a timeout toast. The backend is configured statically to load `models/weighted_stacking_model.pkl` on start and does not have an API endpoint to change the active model at runtime.

### H. Profile Settings (`ProfilePage.jsx`)
* **UI Features**: Clinician information cards, name/phone editors, security change password forms, theme/language drop-downs, notification toggles, authorized clearance checklists, and a recent account activity timeline.
* **API Endpoints**:
  * Fetch Profile: `GET /api/v1/users/me`
  * Update Profile/Password: `PATCH /api/v1/users/me`
* **Backend Service / Query Layer**: `update_profile()` in [user_service.py](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/backend/app/services/user_service.py).
* **Database Tables & Columns**:
  * `users`: `id`, `full_name`, `email`, `phone`, `role`, `department`, `created_at`, `last_login_at`.
* **State Mapping**: **Mixed (Real & Intentional UI-only Mocks)**.
  * **Real**: User name, phone, email, and password modifications are updated directly in PostgreSQL. Clearances are determined dynamically from the authenticated user's database role.
  * **UI-only Mock**:
    * *Theme, Language, and Notification checkboxes*: Saved in component state; changes do not persist to the database.
    * *Change Photo*: Displays an info toast ("Photo uploading is currently disabled") without backend storage.
    * *Recent Account Activity timeline*: Statically hardcoded in [ProfilePage.jsx](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/frontend/src/pages/ProfilePage.jsx#L580-L620) (showing actions for mock patient #82014). The backend has an `activity_logs` table, but there is no service layer or endpoint in the app to write or fetch user logs.

---

## 4. API and Database Inventory Table

The following inventory maps every major UI module to its corresponding API, SQL queries, and implementation status.

| UI Feature Module | Frontend Component / Page | API Endpoint | Service/Query Layer (Backend) | PostgreSQL Tables / Files | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Model Stats** | `LandingPage.jsx` | `GET /api/v1/models/summary` | `_loaded_model_summary()` | `models/model_info.json` | **Real** |
| **System Summary Counts** | `DashboardPage.jsx` | `GET /api/v1/analytics/dashboard` | `build_dashboard_summary()` | `patients`, `predictions` | **Real** |
| **Specialty & Risk Charts** | `DashboardPage.jsx` | `GET /api/v1/analytics/dashboard` | `_risk_distribution()`, `_department_distribution()` | `patients` | **Real** |
| **Dashboard Activity Feed** | `DashboardPage.jsx` | `GET /api/v1/analytics/dashboard` | `_activity_feed()` | `patients`, `predictions` | **Real** |
| **Doctor Scoped Metrics** | `AnalyticsPage.jsx` | `GET /api/v1/analytics/overview` | `_view_for_role()` | `patients` (`assigned_doctor_id`) | **Real** |
| **Researcher Cohort Stats** | `AnalyticsPage.jsx` | `GET /api/v1/analytics/overview` | `_view_for_role()` | `patients`, `predictions` | **Real** |
| **Hospital Stay & Benchmarks**| `AnalyticsPage.jsx` | `GET /api/v1/analytics/overview` | `_view_for_role()` | `patients`, `treatment_effectiveness` | **Real** |
| **Care Recommendations** | `ClinicalSupportPage.jsx`| `GET /api/v1/clinical-support/<id>`| `build_clinical_support()` | `patients` | **Clinical Rules** |
| **Follow-up Planning** | `ClinicalSupportPage.jsx`| `GET /api/v1/clinical-support/<id>`| `build_clinical_support()` | `patients` | **Clinical Rules** |
| **Draft Notes & Log** | `ClinicalSupportPage.jsx`| `POST /api/v1/clinical-support/<id>/draft` | `save_draft()` | `clinical_support_plans` | **Real** |
| **Plan Approval & Treatment** | `ClinicalSupportPage.jsx`| `POST /api/v1/clinical-support/<id>/approve` | `approve_plan()`, `create_treatment_from_plan()` | `clinical_support_plans`, `treatment_effectiveness` | **Real** |
| **Treatment Success stats** | `TreatmentEffectivenessPage.jsx` | `GET /api/v1/treatments` | `build_treatment_overview()` | `treatment_effectiveness` | **Real** |
| **Medication Efficacy Chart** | `TreatmentEffectivenessPage.jsx` | `GET /api/v1/treatments` | `build_treatment_overview()` | `treatment_effectiveness` | **Real** |
| **Medication Updates** | `TreatmentEffectivenessPage.jsx` | `PATCH /api/v1/treatments/<id>` | `update_treatment()` | `treatment_effectiveness` | **Real** |
| **Patient Directory Registry**| `PatientsPage.jsx` | `GET /api/v1/patients` | `list_patients()` | `patients` | **Real** |
| **Patient Profile CRUD** | `PatientsPage.jsx` | `POST / PUT / DELETE /api/v1/patients` | `create_patient()`, `update_patient()` | `patients` | **Real** |
| **Prediction History Logs** | `PredictionsHistoryPage.jsx` | `GET /api/v1/predictions` | `list_prediction_history()` | `prediction_history` | **Real** |
| **Model Version Selection** | `ModelManagementPage.jsx` | *None* (UI-only) | *None* (UI-only) | *None* (UI-only) | **UI-only Mock** |
| **Model Performance Metrics** | `ModelManagementPage.jsx` | `GET /api/v1/models/summary` | `build_model_summary()` | `models/model_info.json`, `predictions` | **Real / Mixed** |
| **Profile Preferences** | `ProfilePage.jsx` | *None* (UI-only) | *None* (UI-only) | *None* (UI-only) | **UI-only Mock** |
| **User Activity Timeline** | `ProfilePage.jsx` | *None* (UI-only) | *None* (UI-only) | `activity_logs` (Unused) | **UI-only Mock** |
| **User Accounts Directory** | `UserManagementPage.jsx` | `GET /api/v1/users` | `list_users()` | `users` | **Real** |

---

## 5. Integration Roadmap

To transition the remaining mixed or UI-only modules into fully database-backed features, we recommend the following implementation sequence:

1. **Persist User Preferences**:
   * Add a `preferences` JSON column to the `users` table.
   * Update `GET /api/v1/users/me` and `PATCH /api/v1/users/me` to retrieve and save theme, language, and notification toggles.
2. **Enable User Activity Tracking**:
   * Implement a backend logging helper that inserts records into the existing `activity_logs` table.
   * Add a new endpoint `GET /api/v1/users/me/activity` in `users.py` to query these records.
   * Update the timeline in `ProfilePage.jsx` to fetch and render this dynamic query.
3. **Expose Model Deployment Endpoint (Optional)**:
   * If dynamic model switching is desired in the future, create a route `POST /api/v1/models/activate` to update the active model configuration path on the backend, removing the frontend timeout mock.
