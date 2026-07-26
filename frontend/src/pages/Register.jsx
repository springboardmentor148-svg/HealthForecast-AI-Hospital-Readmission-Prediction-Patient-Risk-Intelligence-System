import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "Doctor",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };


    const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
        setMessage("Passwords do not match.");
        return;
    }

    if (formData.password.length < 6) {
        setMessage("Password must be at least 6 characters.");
        return;
    }

    setLoading(true);

    try {
        const { confirmPassword, ...payload } = formData;
        await registerUser(payload);

        navigate("/", {
            state: { registered: true },
        });
    } catch (error) {
        const errorMsg =
            error.response?.data?.detail || "Registration failed. Please try again.";
        setMessage(errorMsg);
    } finally {
        setLoading(false);
    }
};

    return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
        <div className="card shadow p-4" style={{ width: "450px" }}>

            <h2 className="text-center mb-4">
                Hospital Readmission Prediction
            </h2>

            <h4 className="text-center mb-4">
                Doctor Registration
            </h4>

            {message && (
                <div className="alert alert-danger">
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>

                <div className="mb-3">
                    <label className="form-label">
                        Full Name
                    </label>

                    <input
                        type="text"
                        className="form-control"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">
                        Email
                    </label>

                    <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">
                        Password
                    </label>

                    <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">
                        Confirm Password
                    </label>

                    <input
                        type="password"
                        className="form-control"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">
                        Role
                    </label>

                    <select
                        className="form-select"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="Doctor">Doctor</option>
                    </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                  >
                 {loading ? "Registering..." : "Register"}
                </button>
            </form>

            <p className="text-center mt-3">
                Already have an account?{" "}
                <Link to="/">
                    Login
                </Link>
            </p>

        </div>
    </div>
);
}

export default Register;