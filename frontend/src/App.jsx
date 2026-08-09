import { PredictionPage } from './pages/PredictionPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.jsx'
import { LandingPage } from './pages/LandingPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { PredictionHistoryPage } from './pages/PredictionHistoryPage.jsx'
import { ReportsPage } from './pages/ReportsPage.jsx'
import { ProfilePage } from './pages/ProfilePage.jsx'
import { SettingsPage } from './pages/SettingsPage.jsx'
import { AdminSettingsPage } from './pages/AdminSettingsPage.jsx'
import { Route, Routes, Navigate } from 'react-router-dom'
import AppLayout from './layout/AppLayout.jsx'
import { ProtectedRoute } from './auth/ProtectedRoute.jsx'
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
import { AddPatientPage } from "./pages/AddPatientPage";
import { DoctorSettingsPage } from './pages/DoctorSettingsPage.jsx'
import './App.css'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
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
        <Route path="profile" element={<ProfilePage />} />
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
        <Route path="profile" element={<ProfilePage />} />
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
        <Route path="profile" element={<ProfilePage />} />
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
        <Route path="patients/new" element={<AddPatientPage />} />
        <Route path="patients/:patientId" element={<DoctorPatientDetailPage />} />
        <Route path="predictions" element={<PredictionHistoryPage />} />
        <Route path="predictions/new" element={<PredictionPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="treatment-effectiveness" element={<DoctorTreatmentEffectivenessPage />} />
        <Route path="care-recommendations" element={<DoctorCareRecommendationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<DoctorSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App