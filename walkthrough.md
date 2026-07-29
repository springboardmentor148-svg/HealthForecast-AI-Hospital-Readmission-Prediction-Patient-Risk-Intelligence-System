# Setup Walkthrough - HealthForecast AI Design System

This walkthrough details the setup of the "HealthForecast AI" design system, reusable primitives, empty routed shell, patients/sidebar/dashboard/prediction workflow, and RBAC architecture security configurations.

## Changes Made

### 1. React + Vite Project Scaffold
- Moved the old Next.js codebase to [dashboard_nextjs](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/dashboard_nextjs) as a backup directory.
- Created a new React template project in [dashboard](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/dashboard).
- Installed packages: `react-router-dom`, `recharts`, `lucide-react`, and `prop-types`.

### 2. Design System Tokens (Tailwind CSS v4)
- Configured theme tokens in [index.css](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/frontend/src/index.css) using the `@theme` syntax for Tailwind CSS v4.
- Loaded font family Inter and Manrope in [index.html](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/frontend/index.html) via Google Fonts.

### 3. Mock Authentication & Single Source of Truth RBAC
- **RBAC Matrix Configuration (`src/config/rbac.js`)**: Maps granular access clearances (view patients, edit records, view medical history, run predictions, analytics, export datasets, user management, and model thresholds) across Doctor, Hospital Administrator, Healthcare Researcher, and System Administrator roles.
- **Authentication Context (`src/contexts/AuthContext.jsx`)**: Declares `currentRole` and `setCurrentRole` context states to enable mock role switching across the application.
- **Route & Component Gating Guard (`src/components/RequirePermission.jsx`)**: Inspects context roles and validates clearances. Shows an "Access Restricted" `EmptyState` view using `ShieldAlert` if permissions are insufficient.

### 4. Decoupled Navigation & Switcher widgets (`src/components/Sidebar.jsx`)
- Filters navigation links dynamically based on the current role's permissions matrix.
- Hides forbidden views (e.g. hides user/model management dashboards for Doctors, and clinical history detail routes for Researchers).
- Implements a dropdown select switcher directly above the user card at the bottom of the sidebar to test role switches on the fly.
- **Development-Only Swticher Annotation**: Added clear comment blocks in the Sidebar code and updated `frontend/README.md` to note that the active profile selector is a **TEMPORARY DEVELOPMENT/TESTING TOOL ONLY** which will be replaced by automated session claims on backend integration.

### 5. Registered Routes Gating Shell (`src/App.jsx`)
- Gated and protected route configurations wrapped in `<RequirePermission>` guards: Patients, Details, Predict, History, Support, Treatment, Analytics, Model, and User Management.
- Created public gateway endpoints outside the private Clinical shell: `/` (Landing Page), `/login` (Sign In), `/register` (Sign Up), and `/forgot-password` (Password Reset).

### 6. Gated Patient Records Filtering (`src/pages/PatientsPage.jsx`)
- **Doctor Filters**: Doctor role is gated to view only patient files assigned to Dr. Sarah Reed.
- **PII Anonymization Filters**: Healthcare Researcher role anonymizes patient names as `"Anonymized Patient #####"` and hides patient IDs.
- **Edit Controls**: Hides the "+ Add Patient" intake button for non-admin roles.

### 7. Patient Details Profile Page (`src/pages/PatientDetailPage.jsx`)
- Checks `selectedPatient` from context. Displays `EmptyState` if null.
- Summary Cards, Medical Histories, RiskGauges, green recommendations, and predict timeline logs.

### 8. Bug Fixes on Dashboard Page
- **StatCard Trend Arrow Direction**: Refactored the trend arrow rendering inside [StatCard.jsx](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/dashboard/src/components/StatCard.jsx) to determine arrow direction explicitly from the sign indicator in `trend.value` (so positive values like `+4.8%` get an upward arrow `ArrowUpRight`, and negative values get a downward arrow `ArrowDownRight`).
- **High-Risk Alerts Risk Banding**: Updated the scrollable notifications widget inside [DashboardPage.jsx](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/dashboard/src/pages/DashboardPage.jsx) to dynamically color-code patient badges by risk classification band (High = `danger` coral, Moderate = `warning` amber, Low = `success` green), resolving the hardcoded badge tone issue.

### 9. Predict -> Result -> History Interactive Workflow
- **Run Prediction Page (`src/pages/PredictPage.jsx`)**: Prefills parameters or selects fallbacks, computing a deterministic readmission probability on submit.
- **Prediction Result Page (`src/pages/PredictResultPage.jsx`)**: Displays computed RiskGauges, SHAP contribution factors, next-steps, and simulated save confirmations.
- **Predictions History Page (`src/pages/PredictionsHistoryPage.jsx`)**: Houses date, risk, and model filters with 10-row paginated DataTable logs.

### 10. Treatment Effectiveness Page (`src/pages/TreatmentEffectivenessPage.jsx`)
- Fully built-in page rendering: StatCards, LineChart for recovery trend metrics, BarChart for drug efficacy, and Outcomes DataTable.

### 11. Role-Adaptive Healthcare Analytics (`src/pages/AnalyticsPage.jsx`)
- Decoupled from role-based hiding; all 4 roles access the menu route.
- The view structure adapts dynamically: Doctor has limited scoped cohort views, Administrator has hospital-wide benchmarks and stats, and Researcher has anonymized population-level charts.

### 12. Friendly Tab Labels Configuration
- Updated [TopBar.jsx](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/dashboard/src/components/TopBar.jsx) to add `/model-management` and `/user-management` path translations. All routes are now correctly mapped to proper titles (Dashboard, Patients, AI Model Management, User Directory Management, etc.) avoiding raw pathname leaks.

### 13. Clinical Decision Support Page (`src/pages/ClinicalSupportPage.jsx`)
- Accessible to all 4 roles. Patient selector, care recommendations, follow-up timeline grid, risk mitigation suggestions, discharge directives, and gated decision plan approvals (disabled for Researcher).

### 14. AI Model Management Page (`src/pages/ModelManagementPage.jsx`)
- **Access Gated**: System Administrator only.
- **Accuracy Metric Column**: Swapped F1-score column with the threshold-optimized Accuracy column in the version history grid. Values range from `56.70%` for baseline v0.9 up to `76.10%` for current stacking v1.2.
- **ML Evaluation Details Modal**: Implemented a details modal popup card when clicking "Details" on a row. It shows the full evaluation statistics: Accuracy, Precision, Recall, F1, and ROC-AUC for that specific model.
- **Performance Trend Chart**: Swapped ROC-AUC metrics to Accuracy rate line charts representing progress across deployments.
- **Currently Deployed Model & Health Panel**: Renders active cards, StatCards, response time, uptime, and serving counts.

### 15. User Management Page (`src/pages/UserManagementPage.jsx`)
- **Access Gated**: System Administrator only.
- Summary stats row, Platform Users list DataTable (10 mock accounts), Edit Role Modal with effective permissions previews, Invite New User Modal (appends local state), and full RBAC matrix reference grid.
- **Table Density and Readability Enhancements**:
  - **Compact Row Height**: Conditional `density="compact"` state prop in `<DataTable />`, reducing vertical paddings to `py-2` and decreasing average row heights.
  - **Compressed User Grouping**: Reduced padding (`gap-2`) in the initials avatar profile section and styled emails to a lighter text size.
  - **Shorter Badge Labels**: Substituted long roles with compact variants (`Doctor`, `Hospital Admin`, `Researcher`, `System Admin`) to prevent layout wrapping.
  - **Clean Assigned Scopes**: Normalized departments to short display names (`Hospital-wide`, `Research Pool`, `Internal Med.`, `Emergency`, `Cardiology`, `Endocrinology`).
  - **Formated Timestamps**: Replaced raw UTC dates with custom formats.
  - **Less Heavy Actions**: Swapped the large primary edit/deactivate buttons for a light *Edit* link and an interactive *More (⋮)* dropdown context menu.
  - **Audit Toolbar**: Placed a search input and three dropdown select inputs (Role, Status, Department filters) right above the table.

### 16. Header TopBar Navigation Refactors (`src/components/TopBar.jsx`)
- **Fixed Width Icons Cluster Container**: Confines the search, bell, and calendar icons to a fixed `w-32 flex justify-end` container on the right edge.
- **Horizontally Scrollable Flex Tab Strip**: Enables the breadcrumb tabs container to flex horizontally with text wrap disabled.
- **Dynamic Scroll Chevron Buttons**: Tracks container boundaries (`scrollWidth > clientWidth`). Left/Right chevrons fade into view dynamically.
- **Auto-Close Cap at 6 Tabs**: Hard caps the tab collection at 6 active items. The `Dashboard` (`/dashboard`) tab is protected.
- **Client-Side Search Dropdown**: Activates a search panel. Clinicians can filter patient profiles by name dynamically and click matching results to load details.
- **Notifications Panel**: Displays alerts on bell icon click.
- **Clinical Schedule Calendar**: Toggles today's clinical meetings and patient follow-up slots.

### 17. Public Landing and Authentication Routing Views
- **Landing Page (`src/pages/LandingPage.jsx`)**: Public navigation bar, Hero details, 4 module cards, model highlights, and the shared Footer wrapper.
- **Login Page (`src/pages/LoginPage.jsx`)**: Form fields credentials, routing redirects, and the shared Footer wrapper.
- **Register Page (`src/pages/RegisterPage.jsx`)**: Clinic registration requested roles, confirmation states, and the shared Footer wrapper.
- **Forgot Password (`src/pages/ForgotPasswordPage.jsx`)**: Password reset instruction workflows, and the shared Footer wrapper.
- **Architecture Annotations**: Added the requested `// TODO (Phase 6)` comment blocks.

### 18. Clinician Profile Settings Page (`src/pages/ProfilePage.jsx` at `/profile`)
- **Main Identity Profile Header**: Displays circular avatar, role badge, hospital scope details, email and contact phone, and active status.
- **Account Information Details Grid**: Contains read-only username, organization, and timestamp details.
- **Security Settings Card**: Houses password changing actions, interactive 2FA toggles, active online session logs, and revoke commands.
- **Preferences Card**: Configures selectable themes (Light, Dark, System Default) and language options, alongside toggleable notification checkboxes.
- **Active Clearances Card**: Inspects context roles and validates authorized/restricted scope capabilities.
- **Account Activity Audit Timeline**: Features chronological timeline tracking for recent clinician actions.
- **Application Version Highlights**: Notes baseline prediction models versioning and ensemble performance metrics. Swapped the CPU placeholder icon with the brand purple rounded square heartbeat logo block.
- **Architecture Annotations**: Includes comments noting future API mappings for profile configuration edits.

### 19. Logo Icon Favicon (`public/favicon.svg`)
- **Vector Format**: Recreated the heartbeat logo in pure scalable vector SVG format. It features a rounded square block in the brand info purple (`#7A5AF8`) and a crisp white ECG heartbeat path matching the Lucide `Activity` icon proportions perfectly.

### 20. Shared Footer Component (`src/components/Footer.jsx`)
- **Visuals & Layout**: Created a single minimal, clean, professional shared Footer. It includes the HealthForecast AI name, heartbeat icon, copyright details, links (Privacy Policy, Terms of Service, Contact), and a version indicator (`v1.2.0`).
- **Layout Shell Gating**: Wrapped the component dynamically inside the main authenticated `Layout` routing wrapper. This automatically mounts the shared footer across all logged-in views.
- **Public Views Integration**: Linked the component at the bottom of all non-authenticated views (Landing, Login, Register, and Forgot Password).

### 21. Global User Logout Integration
- **Sign Out Action**: Added an interactive logout button (`<LogOut />` icon) inside the sidebar profile card at the bottom.
- **Workflow Protection**: Routes through a custom confirmation dialog before redirecting the user back to the `/login` gateway page upon confirmation.

### 22. Reusable Custom ConfirmDialog Component
- **Implementation**: Created a reusable `<ConfirmDialog>` component that supports dynamic title/message, cancel/confirm actions, ESC key, backdrop dismissals, loading spinners, and styled color variants (`"default"` vs `"danger"`).
- **Audit & Replacement**: Replaced all native browser-native `window.confirm()` popups across the codebase (Sidebar Sign Out, User Management Activation/Deactivation toggles, User Password resets, and Model Serving transitions).

### 23. Custom Toast / Snackbar Notification System
- **Provider & Hook (`src/components/Toast.jsx`)**: Built a context provider `<ToastProvider>` exposing the `useToast()` hook. It manages a queue of active toasts styled as clean clinical-style snackbars in the top-right viewport, capped at a maximum of 3 concurrent toasts.
- **Interaction Rules**: Toasts auto-dismiss after `4000ms`, support manual X-dismiss action, and slide in smoothly from the right edge (`animate-slideIn`).
- **Variants**: Includes colored accent borders matching the theme palette: `success` (green), `error` (red), and `info` (purple/info).
- **Audit & Replacement**: Cleaned the entire codebase of browser-native `window.alert()` calls, replacing them with appropriate success, error, or info toast alerts across forms, configuration portals, and mock exports.

## Reference Mock Patient IDs

The following mock patient IDs were defined for consistent route testing and details parsing:
*   **`82014`** (Clara Oswald - High Risk)
*   **`29481`** (Franklin Myers - High Risk)
*   **`48291`** (Arthur Pendelton - High Risk)
*   **`88291`** (Katherine Goble - Moderate Risk)
*   **`71920`** (John Watson - Moderate Risk)
*   **`10293`** (Sarah Jenkins - Low Risk)
*   **`48201`** (Peter Reynolds - Moderate Risk)
*   **`59382`** (Bruce Miller - Low Risk)
*   **`38291`** (Diana Carter - Low Risk)
*   **`28392`** (Clark Davis - High Risk)
*   **`93820`** (Barry Thompson - Low Risk)
*   **`19203`** (Hal Jordan - Moderate Risk)
*   **`50391`** (Anthony Nelson - High Risk)
*   **`69382`** (Steve Rogers - Low Risk)
*   **`78291`** (Natasha Harris - Moderate Risk)
*   **`38201`** (Wanda Mitchell - High Risk)

### 24. Prediction History Page Visual Refinement
- **Filter Card Simplification**: Grouped the start and end dates side-by-side inside a single "Date Range" wrapper. Exposed only Search, Date Range, Risk Band, and Model Version on the default filter row.
- **Collapsible Sorting Options**: Moved Sort By and Sort Order filters behind a collapsible "Advanced Filters" toggle (collapsed by default).
- **Reduced Table Density & Column Shifting**:
  - Reduced table columns to: Patient, Prediction, Probability, Risk Band, Date, Actions.
  - Enabled `density="compact"` and hid the default client-side pagination footer on the shared `DataTable` to reduce row height and prevent horizontal/vertical wrapping.
  - Relocated Threshold, Confidence, and Model Version metrics to a newly designed metadata banner at the top of the **View Result** prediction details page (`PredictResultPage.jsx`).
- **Data Formatting**:
  - Implemented `formatTimestamp` to display raw timestamps as `"14 Jul 2026 · 5:30 PM"`.
  - Implemented `abbreviateModel` to format `"Weighted Stacking Ensemble v1.0.0"` as `"WSE v1.0"`, with the full details visible on tooltip hover.
- **Table Pagination**: Aligned server-side pagination buttons to a clean footer bar immediately below the table layout.

### 25. Dedicated Predictions Page & Independent Routing
- **New Dedicated Predictions Page (`/predict`)**: Mounted the prediction input form on a dedicated route `/predict`. If loaded directly without a patient context, it allows target patient selection via a dropdown picker, pre-fills the standard clinical parameters dynamically, handles loading and errors, and triggers the prediction.
- **Independent History Page (`/predictions/history`)**: Moved the Prediction History page to a dedicated, independent route path `/predictions/history`, keeping all existing filters, lists, and links intact.
- **Direct Prediction Result route (`/predictions/:id`)**: Exposed direct parameter-based routes for prediction results (`/predictions/:id`), which bind directly into `PredictResultPage.jsx` and read parameter contexts dynamically.
- **Sidebar Integration**: Configured both "Predictions" (`/predict`) and "Prediction History" (`/predictions/history`) as independent items inside the main clinical navigation sidebar.

### 26. Predictions Module UI & Navigation Flow Refinement
- **Sidebar Ordering & Highlights**: Reordered sidebar menu items exactly to *Dashboard, Patients, Predictions, Prediction History, Treatment Effectiveness, Clinical Decision Support, Analytics, Settings*. Created a custom path highlight utility `isLinkActive` that highlights `/predictions` for result views (like `/predictions/:id`) but correctly isolates `/predictions/history`.
- **Dedicated Predictions route (`/predictions`)**: Changed the default Predictions input form route from `/predict` to `/predictions` while retaining fallback matching. Updated the page title to `"Patient Readmission Prediction"` and subtitle to `"Run a new hospital readmission risk prediction using the deployed Weighted Stacking Ensemble model."`.
- **Breadcrumb Formatting**: Added a regex resolver in `TopBar.jsx` for `/predictions/:id` so tabs read `"Result #id"` (e.g. `"Result #11"`) instead of showing raw URL paths.
- **Model Banner update**: Modified the metadata card on prediction results to display the full name `"Weighted Stacking Ensemble v1.0"` with model architecture subtext (`"CatBoost • XGBoost • LightGBM"`).
- **Navigation Consistency**: Adjusted back buttons and redirect workflows to flow cleanly from `Predictions (/predictions) ➔ Result (/predictions/:id) ➔ History (/predictions/history)`.
- **Dynamic Tab Titles**: Added mounting hooks in all prediction pages to dynamically configure the browser document titles to match the respective views.

### 27. Module Re-branding to Patient Readmission Prediction
- **Module Label Synchronization**: Re-labeled the Predictions module inside the sidebar, breadcrumbs tabs dictionary (`TopBar.jsx`), and browser window metadata (`PredictPage.jsx`) to use **`Patient Readmission Prediction`** for a highly consistent clinical interface representation.

### 28. Frontend Usability and Profile Data Fixes
- **Profile Sidebar Renaming**: Renamed the sidebar item from `"Settings"` to `"Profile"` to match the header and tab title of the unified Profile settings view.
- **Label Truncation Resolution**: Shortened long sidebar navigation labels that were being cut off:
  - `"Patient Readmission Prediction"` ➔ `"Predictions"`
  - `"Treatment Effectiveness"` ➔ `"Treatment Metrics"`
  - `"Clinical Decision Support"` ➔ `"Clinical Support"`
  - `"Healthcare Analytics"` ➔ `"Analytics"`
  This ensures that navigation text displays cleanly without ellipse truncation at standard widths.
- **Dynamic Profile Rendering**: Integrated a real API call to `/auth/me` (`meRequest`) inside [ProfilePage.jsx](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/frontend/src/pages/ProfilePage.jsx) on mount, updating the context and bindings dynamically. The profile page now displays the actual name, email, department, and ID of the currently logged-in user rather than the hardcoded "Sarah Reed" template.

### 29. Role Gating & Profile Editor Polish
- **Role Source of Truth Integration**: Removed the redundant and disabled mock "Active Security Profile" dropdown from the sidebar. The user role is derived strictly from the authenticated JWT session token and shown consistently in the sidebar badge and Profile page badge.
- **Removed Dev-only Text**: Replaced the developer placeholder toast ("Profile updates are locked during frontend testing phase") with a fully functional inline profile details editor. Users can click `"Edit Profile"`, change their name and phone locally (reverting on cancel or saving), triggering a clean `"Profile details updated successfully."` success toast and immediately updating the user's avatar initials and name displays in the sidebar.

### 30. Tab Persistence & Role Normalization
- **Session-based Tab Persistence**: Updated [TopBar.jsx](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/frontend/src/components/TopBar.jsx) to load and save open tabs using the browser's `sessionStorage`. Even when React Router unmounts components or updating user details triggers parent component rerenders, the tab list persists. Navigating to the Profile page now adds it as a tab alongside other open views without discarding them.
- **Role Normalization**: Wrapped profile updates inside the mount hook of [ProfilePage.jsx](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/frontend/src/pages/ProfilePage.jsx) with `normalizeAuthUser` to map lowercased database role strings to standard UI titles. This maintains permission mappings and prevents dashboard unmounting side effects.

### 31. ROC-AUC / Active Model Fix Verification & Regression Tests
- **Verification**: Verified that when the database is empty, the Dashboard, Model Management, and Profile views successfully retrieve the model's active metadata (specifically the ROC-AUC of `68.34%`) directly from the startup-loaded `model_info.json` artifact instead of reporting zero values. Authentic empty database metrics (patient count, alerts) correctly report 0 without crashing.
- **Regression Tests Added**: Created [test_model_summary.py](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/backend/tests/test_model_summary.py) with two new backend tests:
  1. `test_model_summary_empty_database_success`: Confirms that the model summary returns the active model's metadata (including the correct ROC-AUC score) when database tables are empty.
  2. `test_model_summary_fallback_on_missing_model`: Confirms fallback behavior (reporting `model_loaded=False` and `current_model=None`) if the model fails to load at startup.
  All 21 backend tests pass successfully.
- **Cleanup**: Checked [insights_service.py](file:///Users/soumisaha/HealthForecast-AI-Hospital-Readmission-Prediction-Patient-Risk-Intelligence-System/backend/app/services/insights_service.py) to confirm all model metadata relies on the static ML inference registry.

### 32. ML Inference Parity Check
- **Verification**: Conducted a mathematical parity verification between the trained stacking model (running on fully-scaled test vectors) and the live backend `/predict` endpoint (running on unscaled API inputs) across 9 test samples.
- **Identified Divergences**:
  1.  **Missing StandardScaler Normalization**: The backend model predicts directly on raw features. Although the base estimators (LGBM, XGBoost, CatBoost) are decision trees, their splits were trained on scaled values (e.g. comparing raw `0.0` vs scaled thresholds like `-0.2`), leading to incorrect prediction paths and probability shifts.
  2.  **Missing Medication Defaults**: Unconfigured categorical dummy columns (e.g. `metformin_No`) default to `0.0` in the backend instead of `1.0` (which represents `"No"` medication).
  3.  **Static Placeholders**: High cardinality diagnostic (`diag_1`, `diag_2`, `diag_3`) and other categorical columns are currently set to static values in the backend.
- **Parity Report**: Documented the full comparison table showing probability divergences (ranging from 1% to 22% with one class flip) in the [Inference Parity Report](file:///Users/soumisaha/.gemini/antigravity/brain/4313ab40-ccf0-4cf6-ab47-16a0f0a06ae9/inference_parity_verification.md).

## Verification & Build Results

- **Backend File Relocation**: Moved `run.py` and `requirements.txt` from the repository root into `backend/`, leaving the root containing only repository-level files (`.gitignore`, `LICENSE`, `README.md`, `walkthrough.md`) and subfolders.
- **Frontend Compiler Verification**: Ran `npm run build` in `frontend/`. Successfully compiled all chunks and stylesheets, outputting assets inside `dist/`.
- **Dev Server**: Running cleanly in background.
