import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Patient from "./pages/Patient";
import MedicalHistory from "./pages/MedicalHistory";
import Treatment from "./pages/Treatment";
import TreatmentEffectiveness from "./pages/TreatmentEffectiveness";
import Admission from "./pages/Admission";
import Prediction from "./pages/Prediction";
import PredictionHistory from "./pages/PredictionHistory";
import Trends from "./pages/Trends";
import PatientReport from "./pages/PatientReport";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes */}
        <Route path="/" element={<Auth />} />
        <Route path="/register" element={<Auth />} />

        {/* Protected routes — all share the sidebar via DashboardLayout */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/prediction" element={<Prediction />} />
          <Route path="/prediction-history" element={<PredictionHistory />} />
          <Route path="/trends" element={<Trends />} />
          <Route path="/patients" element={<Patient />} />
          <Route path="/medical-history" element={<MedicalHistory />} />
          <Route path="/treatment" element={<Treatment />} />
          <Route path="/treatment-effectiveness" element={<TreatmentEffectiveness />} />
          <Route path="/admissions" element={<Admission />} />
          <Route path="/patient-report" element={<PatientReport />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;