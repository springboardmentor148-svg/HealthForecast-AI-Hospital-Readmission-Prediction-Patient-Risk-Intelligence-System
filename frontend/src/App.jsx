import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { PatientProvider } from './contexts/PatientContext';
import { AuthProvider } from './contexts/AuthContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import RequireAuth from './components/RequireAuth';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import RequirePermission from './components/RequirePermission';
import { PERMISSIONS } from './config/rbac';

// Components
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import { ToastProvider } from './components/Toast';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import PredictPage from './pages/PredictPage';
import PredictResultPage from './pages/PredictResultPage';
import PredictionsHistoryPage from './pages/PredictionsHistoryPage';
import ClinicalSupportPage from './pages/ClinicalSupportPage';
import TreatmentEffectivenessPage from './pages/TreatmentEffectivenessPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ModelManagementPage from './pages/ModelManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';

// Main App Shell Layout
function Layout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-app">
      {/* Sidebar navigation panel */}
      <Sidebar />
      
      {/* Primary body view wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Tab tracking Header */}
        <TopBar />
        
        {/* Routed child viewport with consistent layout and footer */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-none flex flex-col justify-between">
          <div className="flex-grow pb-6">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnalyticsProvider>
          <PatientProvider>
            <ToastProvider>
              <Routes>
              <Route path="/" element={<LandingPage />} />

              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route element={<RequireAuth />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />

                  <Route
                    path="/patients"
                    element={
                      <RequirePermission permission={PERMISSIONS.VIEW_PATIENTS}>
                        <PatientsPage />
                      </RequirePermission>
                    }
                  />

                  <Route
                    path="/patients/:id"
                    element={
                      <RequirePermission permission={PERMISSIONS.VIEW_MEDICAL_HISTORY}>
                        <PatientDetailPage />
                      </RequirePermission>
                    }
                  />

                  <Route
                    path="/patients/:id/predict"
                    element={
                      <RequirePermission permission={PERMISSIONS.RUN_PREDICTIONS}>
                        <PredictPage />
                      </RequirePermission>
                    }
                  />

                  <Route
                    path="/predict"
                    element={
                      <RequirePermission permission={PERMISSIONS.RUN_PREDICTIONS}>
                        <PredictPage />
                      </RequirePermission>
                    }
                  />

                  <Route
                    path="/predictions"
                    element={
                      <RequirePermission permission={PERMISSIONS.RUN_PREDICTIONS}>
                        <PredictPage />
                      </RequirePermission>
                    }
                  />

                  <Route
                    path="/patients/:id/predict/result"
                    element={
                      <RequirePermission permission={PERMISSIONS.RUN_PREDICTIONS}>
                        <PredictResultPage />
                      </RequirePermission>
                    }
                  />

                  <Route
                    path="/predictions/:id"
                    element={
                      <RequirePermission permission={PERMISSIONS.RUN_PREDICTIONS}>
                        <PredictResultPage />
                      </RequirePermission>
                    }
                  />

                  <Route
                    path="/predictions/history"
                    element={
                      <RequirePermission permission={PERMISSIONS.RUN_PREDICTIONS}>
                        <PredictionsHistoryPage />
                      </RequirePermission>
                    }
                  />

                  <Route
                    path="/clinical-support"
                    element={
                      <RequirePermission permission={PERMISSIONS.VIEW_PATIENTS}>
                        <ClinicalSupportPage />
                      </RequirePermission>
                    }
                  />

                  <Route
                    path="/treatment-effectiveness"
                    element={
                      <RequirePermission permission={PERMISSIONS.VIEW_TREATMENT_EFFECTIVENESS}>
                        <TreatmentEffectivenessPage />
                      </RequirePermission>
                    }
                  />

                  <Route
                    path="/analytics"
                    element={
                      <RequirePermission permission={PERMISSIONS.VIEW_POPULATION_HEALTH}>
                        <AnalyticsPage />
                      </RequirePermission>
                    }
                  />

                  <Route
                    path="/model-management"
                    element={
                      <RequirePermission permission={PERMISSIONS.MANAGE_MODELS}>
                        <ModelManagementPage />
                      </RequirePermission>
                    }
                  />

                  <Route
                    path="/user-management"
                    element={
                      <RequirePermission permission={PERMISSIONS.MANAGE_USERS}>
                        <UserManagementPage />
                      </RequirePermission>
                    }
                  />

                  <Route path="/profile" element={<ProfilePage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </ToastProvider>
          </PatientProvider>
        </AnalyticsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
