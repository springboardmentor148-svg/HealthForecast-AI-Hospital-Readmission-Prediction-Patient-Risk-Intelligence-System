// Import React Hook for storing form data
import { loginUser } from "../services/authService";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";

// Login Component
function Login() {

    // State for Email
    const [email, setEmail] = useState("");

    // State for Password
    const [password, setPassword] = useState("");

    // React Router Navigation
    const navigate = useNavigate();

    // Execute when Login button is clicked
const handleSubmit = async (e) => {

    // Prevent page refresh
    e.preventDefault();

    try {

        // Call backend login API
        const response = await loginUser(email, password);

        console.log("Login Success");

        console.log(response);

        // Save JWT Token
        localStorage.setItem("token", response.access_token);

        // Save User Details
        localStorage.setItem("user", JSON.stringify(response.user));
        
        // Redirect to Dashboard
        navigate("/dashboard");

    }
    catch (error) {

        console.log("Login Failed");

        console.log(error.response?.data);

    }

};

    return (

    <AuthLayout>

        <div className="auth-card">

            <h2 className="auth-title">
                Welcome Back
            </h2>

            <p className="auth-subtitle">
                Sign in to continue to your dashboard.
            </p>

            <form onSubmit={handleSubmit}>

                <div className="mb-3">

                    <label className="form-label">
                        Email Address
                    </label>

                    <input
                        type="email"
                        className="form-control"
                        placeholder="doctor@hospital.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                </div>

                <div className="mb-3">

                    <label className="form-label">
                        Password
                    </label>

                    <input
                        type="password"
                        className="form-control"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">

                    <div className="form-check">

                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="remember"
                        />

                        <label
                            className="form-check-label"
                            htmlFor="remember"
                        >
                            Remember me
                        </label>

                    </div>

                    <a href="#">
                        Forgot Password?
                    </a>

                </div>

                <button
                    type="submit"
                    className="btn w-100"
                      style={{
                        background:"#0F766E",
                        color:"white",
                        height:"48px",
                        borderRadius:"8px"
                       }}
                >
                    Sign In
                </button>

            </form>

            <div className="text-center mt-4">

                Don't have an account?

                <br />

                <button
                    className="btn btn-outline-success mt-2"
                    onClick={() => navigate("/register")}
                >
                    Create Account
                </button>

            </div>

        </div>

    </AuthLayout>

);

}

// Export Login component
export default Login;