import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {

    // Get token from Local Storage
    const token = localStorage.getItem("token");

    // If token is not present, go to Login page
    if (!token) {
        return <Navigate to="/" replace />;
    }

    // If token exists, show requested page
    return children;
}

export default ProtectedRoute;