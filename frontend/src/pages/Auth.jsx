import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../services/authService";
import { FiActivity, FiUsers, FiTrendingUp, FiShield } from "react-icons/fi";

function Auth() {
    const navigate = useNavigate();

    // Which tab is active: "login" or "register"
    const [activeTab, setActiveTab] = useState("login");

    // ---------- Login form state ----------
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState("");

    // ---------- Register form state ----------
    const [registerData, setRegisterData] = useState({
        full_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "Doctor",
    });
    const [registerLoading, setRegisterLoading] = useState(false);
    const [registerMessage, setRegisterMessage] = useState("");
    const [registerSuccess, setRegisterSuccess] = useState(false);

    // Switch tabs and clear any leftover messages
    const switchTab = (tab) => {
        setActiveTab(tab);
        setLoginError("");
        setRegisterMessage("");
    };

    // ---------- Login submit ----------
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError("");
        setLoginLoading(true);

        try {
            const response = await loginUser(loginEmail, loginPassword);

            localStorage.setItem("token", response.access_token);
            localStorage.setItem("user", JSON.stringify(response.user));

            navigate("/dashboard");
        } catch (error) {
            const errorMsg =
                error.response?.data?.detail || "Invalid email or password.";
            setLoginError(errorMsg);
        } finally {
            setLoginLoading(false);
        }
    };

    // ---------- Register submit ----------
    const handleRegisterChange = (e) => {
        setRegisterData({
            ...registerData,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegisterMessage("");

        if (registerData.password !== registerData.confirmPassword) {
            setRegisterMessage("Passwords do not match.");
            return;
        }

        if (registerData.password.length < 6) {
            setRegisterMessage("Password must be at least 6 characters.");
            return;
        }

        setRegisterLoading(true);

        try {
            const { confirmPassword, ...payload } = registerData;
            await registerUser(payload);

            // Registration succeeded — switch to Login tab with a success note
            setRegisterSuccess(true);
            setActiveTab("login");
            setRegisterData({
                full_name: "",
                email: "",
                password: "",
                confirmPassword: "",
                role: "Doctor",
            });
        } catch (error) {
            const errorMsg =
                error.response?.data?.detail || "Registration failed. Please try again.";
            setRegisterMessage(errorMsg);
        } finally {
            setRegisterLoading(false);
        }
    };

    return (
        <div className="d-flex" style={{ minHeight: "100vh" }}>

            {/* Left branding panel — hidden on small screens */}
            <div
                className="d-none d-md-flex flex-column justify-content-center align-items-center text-white p-5"
                style={{
                    width: "45%",
                    background: "linear-gradient(135deg, #4a7bd9 0%, #2fa66b 100%)",
                }}
            >
                <FiActivity size={64} className="mb-4" />

                <h1 className="fw-bold text-center mb-2">
                    HealthForecast AI
                </h1>
                <p className="text-center mb-5" style={{ maxWidth: "380px", opacity: 0.9 }}>
                    Hospital Readmission Prediction &amp; Patient Risk
                    Intelligence System
                </p>

                <div style={{ maxWidth: "360px", width: "100%" }}>
                    <div className="d-flex align-items-center mb-3">
                        <FiUsers size={20} className="me-3 flex-shrink-0" />
                        <span>Manage patients and medical history in one place</span>
                    </div>
                    <div className="d-flex align-items-center mb-3">
                        <FiTrendingUp size={20} className="me-3 flex-shrink-0" />
                        <span>AI-powered readmission risk scoring</span>
                    </div>
                    <div className="d-flex align-items-center">
                        <FiShield size={20} className="me-3 flex-shrink-0" />
                        <span>Secure, doctor-only access</span>
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div
                className="d-flex flex-column justify-content-center align-items-center flex-grow-1 p-4"
                style={{ backgroundColor: "#ffffff" }}
            >
                <div style={{ width: "100%", maxWidth: "400px" }}>

                    {/* Shown only on small screens, since the left panel is hidden there */}
                    <h2 className="text-center mb-1 d-md-none">
                        HealthForecast AI
                    </h2>

                    <h3 className="mb-1">Welcome back</h3>
                    <p className="text-muted mb-4">
                        Sign in to your doctor account
                    </p>

                    {/* Tabs */}
                    <ul className="nav nav-tabs mb-4">
                        <li className="nav-item flex-fill text-center">
                            <button
                                className={`nav-link w-100 ${activeTab === "login" ? "active" : ""}`}
                                onClick={() => switchTab("login")}
                                type="button"
                            >
                                Login
                            </button>
                        </li>
                        <li className="nav-item flex-fill text-center">
                            <button
                                className={`nav-link w-100 ${activeTab === "register" ? "active" : ""}`}
                                onClick={() => switchTab("register")}
                                type="button"
                            >
                                Register
                            </button>
                        </li>
                    </ul>

                    {/* ---------- Login Tab ---------- */}
                    {activeTab === "login" && (
                        <>
                            {registerSuccess && (
                                <div className="alert alert-success">
                                    Registration successful — please log in.
                                </div>
                            )}

                            {loginError && (
                                <div className="alert alert-danger">
                                    {loginError}
                                </div>
                            )}

                            <form onSubmit={handleLoginSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        placeholder="Enter your email"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Enter your password"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={loginLoading}
                                >
                                    {loginLoading ? "Logging in..." : "Login"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* ---------- Register Tab ---------- */}
                    {activeTab === "register" && (
                        <>
                            {registerMessage && (
                                <div className="alert alert-danger">
                                    {registerMessage}
                                </div>
                            )}

                            <form onSubmit={handleRegisterSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="full_name"
                                        value={registerData.full_name}
                                        onChange={handleRegisterChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={registerData.email}
                                        onChange={handleRegisterChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        value={registerData.password}
                                        onChange={handleRegisterChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Confirm Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="confirmPassword"
                                        value={registerData.confirmPassword}
                                        onChange={handleRegisterChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Role</label>
                                    <select
                                        className="form-select"
                                        name="role"
                                        value={registerData.role}
                                        onChange={handleRegisterChange}
                                    >
                                        <option value="Doctor">Doctor</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={registerLoading}
                                >
                                    {registerLoading ? "Registering..." : "Register"}
                                </button>
                            </form>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}

export default Auth;






// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { loginUser, registerUser } from "../services/authService";

// function Auth() {
//     const navigate = useNavigate();

//     // Which tab is active: "login" or "register"
//     const [activeTab, setActiveTab] = useState("login");

//     // ---------- Login form state ----------
//     const [loginEmail, setLoginEmail] = useState("");
//     const [loginPassword, setLoginPassword] = useState("");
//     const [loginLoading, setLoginLoading] = useState(false);
//     const [loginError, setLoginError] = useState("");

//     // ---------- Register form state ----------
//     const [registerData, setRegisterData] = useState({
//         full_name: "",
//         email: "",
//         password: "",
//         confirmPassword: "",
//         role: "Doctor",
//     });
//     const [registerLoading, setRegisterLoading] = useState(false);
//     const [registerMessage, setRegisterMessage] = useState("");
//     const [registerSuccess, setRegisterSuccess] = useState(false);

//     // Switch tabs and clear any leftover messages
//     const switchTab = (tab) => {
//         setActiveTab(tab);
//         setLoginError("");
//         setRegisterMessage("");
//     };

//     // ---------- Login submit ----------
//     const handleLoginSubmit = async (e) => {
//         e.preventDefault();
//         setLoginError("");
//         setLoginLoading(true);

//         try {
//             const response = await loginUser(loginEmail, loginPassword);

//             localStorage.setItem("token", response.access_token);
//             localStorage.setItem("user", JSON.stringify(response.user));

//             navigate("/dashboard");
//         } catch (error) {
//             const errorMsg =
//                 error.response?.data?.detail || "Invalid email or password.";
//             setLoginError(errorMsg);
//         } finally {
//             setLoginLoading(false);
//         }
//     };

//     // ---------- Register submit ----------
//     const handleRegisterChange = (e) => {
//         setRegisterData({
//             ...registerData,
//             [e.target.name]: e.target.value,
//         });
//     };

//     const handleRegisterSubmit = async (e) => {
//         e.preventDefault();
//         setRegisterMessage("");

//         if (registerData.password !== registerData.confirmPassword) {
//             setRegisterMessage("Passwords do not match.");
//             return;
//         }

//         if (registerData.password.length < 6) {
//             setRegisterMessage("Password must be at least 6 characters.");
//             return;
//         }

//         setRegisterLoading(true);

//         try {
//             const { confirmPassword, ...payload } = registerData;
//             await registerUser(payload);

//             // Registration succeeded — switch to Login tab with a success note
//             setRegisterSuccess(true);
//             setActiveTab("login");
//             setRegisterData({
//                 full_name: "",
//                 email: "",
//                 password: "",
//                 confirmPassword: "",
//                 role: "Doctor",
//             });
//         } catch (error) {
//             const errorMsg =
//                 error.response?.data?.detail || "Registration failed. Please try again.";
//             setRegisterMessage(errorMsg);
//         } finally {
//             setRegisterLoading(false);
//         }
//     };

//     return (
//         <div
//             className="container d-flex justify-content-center align-items-center py-5"
//             style={{ minHeight: "100vh" }}
//         >
//             <div className="card shadow p-4" style={{ width: "450px" }}>

//                 <h2 className="text-center mb-1">
//                     HealthForecast AI
//                 </h2>
//                 <p className="text-center text-muted mb-4">
//                     Hospital Readmission Prediction & Patient Risk Intelligence System
//                 </p>

//                 {/* Tabs */}
//                 <ul className="nav nav-tabs mb-4">
//                     <li className="nav-item flex-fill text-center">
//                         <button
//                             className={`nav-link w-100 ${activeTab === "login" ? "active" : ""}`}
//                             onClick={() => switchTab("login")}
//                             type="button"
//                         >
//                             Login
//                         </button>
//                     </li>
//                     <li className="nav-item flex-fill text-center">
//                         <button
//                             className={`nav-link w-100 ${activeTab === "register" ? "active" : ""}`}
//                             onClick={() => switchTab("register")}
//                             type="button"
//                         >
//                             Register
//                         </button>
//                     </li>
//                 </ul>

//                 {/* ---------- Login Tab ---------- */}
//                 {activeTab === "login" && (
//                     <>
//                         {registerSuccess && (
//                             <div className="alert alert-success">
//                                 Registration successful — please log in.
//                             </div>
//                         )}

//                         {loginError && (
//                             <div className="alert alert-danger">
//                                 {loginError}
//                             </div>
//                         )}

//                         <form onSubmit={handleLoginSubmit}>
//                             <div className="mb-3">
//                                 <label className="form-label">Email</label>
//                                 <input
//                                     type="email"
//                                     className="form-control"
//                                     placeholder="Enter your email"
//                                     value={loginEmail}
//                                     onChange={(e) => setLoginEmail(e.target.value)}
//                                     required
//                                 />
//                             </div>

//                             <div className="mb-3">
//                                 <label className="form-label">Password</label>
//                                 <input
//                                     type="password"
//                                     className="form-control"
//                                     placeholder="Enter your password"
//                                     value={loginPassword}
//                                     onChange={(e) => setLoginPassword(e.target.value)}
//                                     required
//                                 />
//                             </div>

//                             <button
//                                 type="submit"
//                                 className="btn btn-primary w-100"
//                                 disabled={loginLoading}
//                             >
//                                 {loginLoading ? "Logging in..." : "Login"}
//                             </button>
//                         </form>
//                     </>
//                 )}

//                 {/* ---------- Register Tab ---------- */}
//                 {activeTab === "register" && (
//                     <>
//                         {registerMessage && (
//                             <div className="alert alert-danger">
//                                 {registerMessage}
//                             </div>
//                         )}

//                         <form onSubmit={handleRegisterSubmit}>
//                             <div className="mb-3">
//                                 <label className="form-label">Full Name</label>
//                                 <input
//                                     type="text"
//                                     className="form-control"
//                                     name="full_name"
//                                     value={registerData.full_name}
//                                     onChange={handleRegisterChange}
//                                     required
//                                 />
//                             </div>

//                             <div className="mb-3">
//                                 <label className="form-label">Email</label>
//                                 <input
//                                     type="email"
//                                     className="form-control"
//                                     name="email"
//                                     value={registerData.email}
//                                     onChange={handleRegisterChange}
//                                     required
//                                 />
//                             </div>

//                             <div className="mb-3">
//                                 <label className="form-label">Password</label>
//                                 <input
//                                     type="password"
//                                     className="form-control"
//                                     name="password"
//                                     value={registerData.password}
//                                     onChange={handleRegisterChange}
//                                     required
//                                 />
//                             </div>

//                             <div className="mb-3">
//                                 <label className="form-label">Confirm Password</label>
//                                 <input
//                                     type="password"
//                                     className="form-control"
//                                     name="confirmPassword"
//                                     value={registerData.confirmPassword}
//                                     onChange={handleRegisterChange}
//                                     required
//                                 />
//                             </div>

//                             <div className="mb-3">
//                                 <label className="form-label">Role</label>
//                                 <select
//                                     className="form-select"
//                                     name="role"
//                                     value={registerData.role}
//                                     onChange={handleRegisterChange}
//                                 >
//                                     <option value="Doctor">Doctor</option>
//                                 </select>
//                             </div>

//                             <button
//                                 type="submit"
//                                 className="btn btn-primary w-100"
//                                 disabled={registerLoading}
//                             >
//                                 {registerLoading ? "Registering..." : "Register"}
//                             </button>
//                         </form>
//                     </>
//                 )}

//             </div>
//         </div>
//     );
// }

// export default Auth;