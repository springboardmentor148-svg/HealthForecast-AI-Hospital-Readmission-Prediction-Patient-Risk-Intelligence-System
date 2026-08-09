import "./Login.css";

import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { FaEnvelope, FaSignInAlt } from "react-icons/fa";

import { toast } from "react-hot-toast";

import AuthLayout from "../../../components/Auth/AuthLayout";
import PasswordInput from "../../../components/Auth/PasswordInput";

import authService from "../../../services/authService";
import useAuth from "../../../hooks/useAuth";

export default function Login() {

    const navigate = useNavigate();

    const { login } = useAuth();

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({

        email: "",

        password: "",

        remember: false

    });

    const handleChange = (e) => {

        const { name, value, type, checked } = e.target;

        setFormData({

            ...formData,

            [name]: type === "checkbox" ? checked : value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            setLoading(true);

            // Login API

            const response = await authService.login({

                email: formData.email,

                password: formData.password

            });

            const token = response.data.access_token;

            localStorage.setItem("token", token);

            // Fetch logged-in user

            const userResponse = await authService.getCurrentUser();

            login(

                userResponse.data,

                token

            );

            toast.success(

                `Welcome ${userResponse.data.name}`

            );

            navigate("/");

        }

        catch (error) {

            toast.error(

                error.response?.data?.detail ||

                "Invalid Email or Password"

            );

        }

        finally {

            setLoading(false);

        }

    };

    return (

        <AuthLayout

            title="Welcome Back"

            subtitle="Login to continue using HealthForecast AI."

        >

            <form

                className="loginForm"

                onSubmit={handleSubmit}

            >

                {/* Email */}

                <div className="inputGroup">

                    <label>

                        Email Address

                    </label>

                    <div className="inputBox">

                        <FaEnvelope />

                        <input

                            type="email"

                            name="email"

                            placeholder="doctor@hospital.com"

                            value={formData.email}

                            onChange={handleChange}

                            required

                        />

                    </div>

                </div>

                {/* Password */}

                <PasswordInput

                    name="password"

                    value={formData.password}

                    onChange={handleChange}

                    placeholder="Enter Password"

                />

                {/* Remember */}

                <div className="rememberRow">

                    <label>

                        <input

                            type="checkbox"

                            name="remember"

                            checked={formData.remember}

                            onChange={handleChange}

                        />

                        Remember Me

                    </label>

                    <Link

                        to="/forgot-password"

                    >

                        Forgot Password?

                    </Link>

                </div>

                {/* Login Button */}

                <button

                    type="submit"

                    className="loginBtn"

                    disabled={loading}

                >

                    {

                        loading

                        ?

                        "Signing In..."

                        :

                        <>

                            <FaSignInAlt />

                            Login

                        </>

                    }

                </button>

                {/* Register */}

                <div className="registerLink">

                    Don't have an account?

                    <Link

                        to="/register"

                    >

                        Register

                    </Link>

                </div>

            </form>

        </AuthLayout>

    );

}