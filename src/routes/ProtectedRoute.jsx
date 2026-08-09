import { Navigate } from "react-router-dom";

import useAuth from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {

    const {

        isAuthenticated,

        loading

    } = useAuth();

    if (loading) {

        return <h2>Loading...</h2>;

    }

    if (!isAuthenticated) {

        return <Navigate to="/login" replace />;

    }

    return children;

}