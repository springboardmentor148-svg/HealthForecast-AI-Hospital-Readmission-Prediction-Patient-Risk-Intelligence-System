import { Footer } from './components/Footer.jsx'
import { Navigation } from './components/Navigation.jsx'
import { PredictionPage } from './pages/PredictionPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { PredictionHistoryPage } from './pages/PredictionHistoryPage.jsx'
import { ReportsPage } from './pages/ReportsPage.jsx'
import { ProfilePage } from './pages/ProfilePage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { AdminSettingsPage } from './pages/AdminSettingsPage.jsx'
import { Route, Routes, Navigate } from 'react-router-dom'
import AppLayout from './layout/AppLayout.jsx'
import { ProtectedRoute } from './auth/ProtectedRoute.jsx'
import { FaStethoscope, FaUserDoctor, FaLock, FaClipboardCheck } from 'react-icons/fa6'
import AdminLayout from './layout/AdminLayout.jsx'
import HospitalAdminLayout from './layout/HospitalAdminLayout.jsx'
import ResearcherLayout from './layout/ResearcherLayout.jsx'
import DoctorLayout from './layout/DoctorLayout.jsx'
import { AdminOverviewPage } from './pages/AdminOverviewPage.jsx'
import { HospitalAdminOverviewPage } from './pages/HospitalAdminOverviewPage.jsx'
import { HospitalAdminOutcomesPage } from './pages/HospitalAdminOutcomesPage.jsx'
import { HospitalAdminReportsPage } from './pages/HospitalAdminReportsPage.jsx'
import { HospitalAdminRiskForecastPage } from './pages/HospitalAdminRiskForecastPage.jsx'
import { HospitalAdminTreatmentEffectivenessPage } from './pages/HospitalAdminTreatmentEffectivenessPage.jsx'
import { HospitalAdminPopulationHealthPage } from './pages/HospitalAdminPopulationHealthPage.jsx'
import { HospitalAdminSettingsPage } from './pages/HospitalAdminSettingsPage.jsx'
import { ResearcherOverviewPage } from './pages/ResearcherOverviewPage.jsx'
import { ResearcherTreatmentAnalysisPage } from './pages/ResearcherTreatmentAnalysisPage.jsx'
import { ResearcherPopulationHealthPage } from './pages/ResearcherPopulationHealthPage.jsx'
import { ResearcherRiskTrendsPage } from './pages/ResearcherRiskTrendsPage.jsx'
import { ResearcherDatasetExportPage } from './pages/ResearcherDatasetExportPage.jsx'
import { ResearcherSettingsPage } from './pages/ResearcherSettingsPage.jsx'
import { RoleRoute } from './auth/RoleRoute.jsx'
import { AdminUsersPage } from './pages/AdminUsersPage.jsx'
import { AdminAuditPage } from './pages/AdminAuditPage.jsx'
import { AdminDatasetsPage } from './pages/AdminDatasetsPage.jsx'
import { AdminModelsPage } from './pages/AdminModelsPage.jsx'
import { DoctorOverviewPage } from './pages/DoctorOverviewPage.jsx'
import { DoctorPatientsPage } from './pages/DoctorPatientsPage.jsx'
import { DoctorPatientDetailPage } from './pages/DoctorPatientDetailPage.jsx'
import { DoctorTreatmentEffectivenessPage } from './pages/DoctorTreatmentEffectivenessPage.jsx'
import { DoctorCareRecommendationsPage } from './pages/DoctorCareRecommendationsPage.jsx'
import { DoctorSettingsPage } from './pages/DoctorSettingsPage.jsx'
import './App.css'

function HomePage() {
  return (
    <div className="app-shell">
      <Navigation mode="public" />
      <main>
        <section className="hero-section" id="home">
          <div className="hero-copy">
            <span className="hero-badge">Healthcare Analytics Platform</span>
            <h1>HealthForecastAI</h1>
            <p className="hero-subtitle">Hospital Readmission Prediction System</p>
            <p className="hero-description">
              Predict patient readmission risk using machine learning to help care teams identify vulnerable cases earlier and support better post-discharge planning.
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="/app/prediction">Start Prediction</a>
              <a className="secondary-button" href="#about">Learn More</a>
            </div>
          </div>
          <div className="hero-panel" aria-label="Project overview card">
            <div className="panel-header">
              <span className="panel-label">System overview</span>
              <span className="panel-status">Ready for prediction</span>
            </div>
            <div className="metric-grid">
              <div className="metric-card"><strong>ML</strong><span>Insights driven by trained models</span></div>
              <div className="metric-card"><strong>24/7</strong><span>Designed for continuous hospital workflows</span></div>
              <div className="metric-card"><strong>Fast</strong><span>Quick access to risk awareness and next steps</span></div>
            </div>
          </div>
        </section>
        <section className="section" id="prediction">
          <div className="prediction-callout">
            <div>
              <p className="callout-title">Ready to predict?</p>
              <p className="callout-text">Click the button below to open the full prediction interface and enter patient data.</p>
            </div>
            <a className="primary-button" href="/app/prediction">Go to Prediction Form</a>
          </div>
        </section>
        <section className="section" id="about">
          <div className="section-heading">
            <span className="about-eyebrow">About the platform</span>
            <h2>Built for the moments that matter most</h2>
            <p>
              HealthForecastAI turns routine discharge data into an early warning
              system, so care teams can focus follow-up where it's needed most.
            </p>
          </div>

          <div className="about-layout">
            <div className="about-card about-card-main">
              <div className="about-icon">
                <FaStethoscope aria-hidden="true" />
              </div>
              <h3>What this platform does</h3>
              <p>
                The application scores every discharge against a trained model to
                flag patients likely to be readmitted, giving your team a clear
                signal before it becomes a costly outcome.
              </p>

              <ul className="about-highlights">
                <li>Enter patient and admission details in a guided form</li>
                <li>Get an instant readmission risk score with confidence</li>
                <li>Use the result to prioritize discharge planning</li>
              </ul>
            </div>

            <div className="about-list">
              <div className="about-item">
                <div className="about-item-icon">
                  <FaUserDoctor aria-hidden="true" />
                </div>
                <h3>Built for care teams</h3>
                <p>
                  A clean, focused interface keeps clinical and admin staff moving
                  quickly, without extra training or clutter.
                </p>
              </div>

              <div className="about-item">
                <div className="about-item-icon">
                  <FaClipboardCheck aria-hidden="true" />
                </div>
                <h3>Decision support, not a diagnosis</h3>
                <p>
                  Every result is a support signal for your clinical judgment, not
                  a replacement for provider review.
                </p>
              </div>

              <div className="about-item">
                <div className="about-item-icon">
                  <FaLock aria-hidden="true" />
                </div>
                <h3>Secure by design</h3>
                <p>
                  Patient data stays protected throughout the workflow, from entry
                  to prediction to review.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="prediction" element={<PredictionPage />} />
        <Route path="history" element={<PredictionHistoryPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/app/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['System Administrator']}>
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminOverviewPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="audit" element={<AdminAuditPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="datasets" element={<AdminDatasetsPage />} />
        <Route path="models" element={<AdminModelsPage />} />
      </Route>

      <Route
        path="/app/hospital-admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Hospital Administrator']}>
              <HospitalAdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<HospitalAdminOverviewPage />} />
        <Route path="outcomes" element={<HospitalAdminOutcomesPage />} />
        <Route path="reports" element={<HospitalAdminReportsPage />} />
        <Route path="settings" element={<HospitalAdminSettingsPage />} />
        <Route path="risk-forecast" element={<HospitalAdminRiskForecastPage />} />
        <Route path="treatment-effectiveness" element={<HospitalAdminTreatmentEffectivenessPage />} />
        <Route path="population-health" element={<HospitalAdminPopulationHealthPage />} />
      </Route>

      <Route
        path="/app/research"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Healthcare Researcher']}>
              <ResearcherLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<ResearcherOverviewPage />} />
        <Route path="treatment-analysis" element={<ResearcherTreatmentAnalysisPage />} />
        <Route path="dataset-export" element={<ResearcherDatasetExportPage />} />
        <Route path="risk-trends" element={<ResearcherRiskTrendsPage />} />
        <Route path="population-health" element={<ResearcherPopulationHealthPage />} />
        <Route path="settings" element={<ResearcherSettingsPage />} />
      </Route>

      <Route
        path="/app/doctor"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['Doctor']}>
              <DoctorLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<DoctorOverviewPage />} />
        <Route path="patients" element={<DoctorPatientsPage />} />
        <Route path="patients/:patientId" element={<DoctorPatientDetailPage />} />
        <Route path="predictions" element={<PredictionHistoryPage />} />
        <Route path="predictions/new" element={<PredictionPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="treatment-effectiveness" element={<DoctorTreatmentEffectivenessPage />} />
        <Route path="care-recommendations" element={<DoctorCareRecommendationsPage />} />
        <Route path="settings" element={<DoctorSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App