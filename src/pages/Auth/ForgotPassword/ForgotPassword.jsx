import "./ForgotPassword.css";

import { useState } from "react";

import { Link } from "react-router-dom";

import {
    FaEnvelope,
    FaArrowLeft,
    FaPaperPlane
} from "react-icons/fa";

import AuthLayout from "../../../components/Auth/AuthLayout";

export default function ForgotPassword(){

    const [email,setEmail]=useState("");

    const [loading,setLoading]=useState(false);

    const handleSubmit=(e)=>{

        e.preventDefault();

        setLoading(true);

        // TODO:
        // Call Spring Boot API

        setTimeout(()=>{

            setLoading(false);

            alert("Password reset link sent successfully.");

        },1500);

    };

    return(

        <AuthLayout

            title="Forgot Password"

            subtitle="Enter your registered email to receive a password reset link."

        >

            <form

                className="forgotForm"

                onSubmit={handleSubmit}

            >

                <div className="inputGroup">

                    <label>

                        Email Address

                    </label>

                    <div className="inputBox">

                        <FaEnvelope/>

                        <input

                            type="email"

                            placeholder="doctor@hospital.com"

                            value={email}

                            onChange={(e)=>setEmail(e.target.value)}

                            required

                        />

                    </div>

                </div>

                <button

                    className="forgotBtn"

                    disabled={loading}

                >

                    {

                        loading

                        ?

                        "Sending..."

                        :

                        <>

                            <FaPaperPlane/>

                            Send Reset Link

                        </>

                    }

                </button>

                <div className="backLogin">

                    <Link to="/login">

                        <FaArrowLeft/>

                        Back to Login

                    </Link>

                </div>

            </form>

        </AuthLayout>

    );

}