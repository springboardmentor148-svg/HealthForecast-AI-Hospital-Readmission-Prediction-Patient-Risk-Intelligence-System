import "./AuthLayout.css";

import { FaHeartbeat } from "react-icons/fa";

import authIllustration from "../../assets/images/auth-illustration.png";
import logo from "../../assets/images/logo.png";

export default function AuthLayout({

    title,
    subtitle,
    children

}) {

    return (

        <div className="authContainer">

            {/* Left Panel */}

            <div className="authLeft">

                <div className="overlay">

                    <img

                        src={logo}

                        alt="Logo"

                        className="logo"

                    />

                    <h1>

                        HealthForecast AI

                    </h1>

                    <p>

                        AI Powered Hospital Readmission Prediction System

                    </p>

                    <div className="features">

                        <div>

                            <FaHeartbeat/>

                            Intelligent Readmission Prediction

                        </div>

                        <div>

                            <FaHeartbeat/>

                            Secure Patient Management

                        </div>

                        <div>

                            <FaHeartbeat/>

                            Clinical Decision Support

                        </div>

                        <div>

                            <FaHeartbeat/>

                            Machine Learning Insights

                        </div>

                    </div>

                    <img

                        src={authIllustration}

                        alt="Medical"

                        className="illustration"

                    />

                </div>

            </div>

            {/* Right Panel */}

            <div className="authRight">

                <div className="authCard">

                    <h2>

                        {title}

                    </h2>

                    <p>

                        {subtitle}

                    </p>

                    {children}

                </div>

            </div>

        </div>

    );

}