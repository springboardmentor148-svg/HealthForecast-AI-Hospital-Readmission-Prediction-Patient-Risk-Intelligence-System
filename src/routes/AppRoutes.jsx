import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

import MainLayout from "../layouts/MainLayout";

// Authentication
import Login from "../pages/Auth/Login/Login";
import Register from "../pages/Auth/Register/Register";
import ForgotPassword from "../pages/Auth/ForgotPassword/ForgotPassword";

// Pages
import Dashboard from "../pages/Dashboard/Dashboard";
import Patients from "../pages/Patients/Patients";
import Prediction from "../pages/Prediction/Prediction";
import PredictionHistory from "../pages/PredictionHistory/PredictionHistory";
import Reports from "../pages/Reports/Reports";
import Profile from "../pages/Profile/Profile";
import Settings from "../pages/Settings/Settings";

export default function AppRoutes() {

    return (

        <Routes>

            {/* Public Routes */}

            <Route

                path="/login"

                element={

                    <PublicRoute>

                        <Login/>

                    </PublicRoute>

                }

            />

            <Route

                path="/register"

                element={

                    <PublicRoute>

                        <Register/>

                    </PublicRoute>

                }

            />

            <Route

                path="/forgot-password"

                element={

                    <PublicRoute>

                        <ForgotPassword/>

                    </PublicRoute>

                }

            />

            {/* Protected Routes */}

            <Route

                path="/"

                element={

                    <ProtectedRoute>

                        <MainLayout/>

                    </ProtectedRoute>

                }

            >

                <Route

                    index

                    element={<Dashboard/>}

                />

                <Route

                    path="patients"

                    element={<Patients/>}

                />

                <Route

                    path="prediction"

                    element={<Prediction/>}

                />

                <Route

                    path="history"

                    element={<PredictionHistory/>}

                />

                <Route

                    path="reports"

                    element={<Reports/>}

                />

                <Route

                    path="profile"

                    element={<Profile/>}

                />

                <Route

                    path="settings"

                    element={<Settings/>}

                />

            </Route>

            {/* 404 */}

            <Route

                path="*"

                element={<Navigate to="/login"/>}

            />

        </Routes>

    );

}