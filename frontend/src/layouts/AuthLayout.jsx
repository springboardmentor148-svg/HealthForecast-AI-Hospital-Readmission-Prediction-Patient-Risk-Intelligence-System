import "../styles/auth.css";
import authImage from "../assets/images/auth-illustration.svg";

function AuthLayout({ children }) {
    return (
        <div className="auth-container">

            {/* Left Section */}
            <div className="auth-left">

                <div>

                    <div className="logo-circle">
                        <i className="bi bi-heart-pulse-fill"></i>
                    </div>

                    <h1 className="brand-title">
                        Prognexa AI
                    </h1>

                    <p className="brand-subtitle">
                        Hospital Readmission Prediction &
                        <br />
                        Patient Risk Intelligence System
                    </p>

                </div>

            </div>

            {/* Right Section */}

            <div className="auth-right">

                {children}

            </div>

        </div>
    );
}

export default AuthLayout;