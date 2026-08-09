import "./Register.css";

import { useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { toast } from "react-hot-toast";

import {
    FaUser,
    FaEnvelope,
    FaUserTag,
    FaUserPlus
} from "react-icons/fa";

import AuthLayout from "../../../components/Auth/AuthLayout";
import PasswordInput from "../../../components/Auth/PasswordInput";

import authService from "../../../services/authService";

export default function Register() {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({

        fullName: "",

        email: "",

        role: "Doctor",

        password: "",

        confirmPassword: ""

    });

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData({

            ...formData,

            [name]: value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {

            toast.error("Passwords do not match");

            return;

        }

        try {

            setLoading(true);

            await authService.register({

                full_name: formData.fullName,

                email: formData.email,

                password: formData.password,

                role: formData.role

            });

            toast.success("Registration Successful");

            navigate("/login");

        }

        catch (error) {

            toast.error(

                error.response?.data?.message ||

                "Registration Failed"

            );

        }

        finally {

            setLoading(false);

        }

    };

    return (

        <AuthLayout

            title="Create Account"

            subtitle="Create your HealthForecast AI account."

        >

            <form

                className="registerForm"

                onSubmit={handleSubmit}

            >

                {/* Full Name */}

                <div className="inputGroup">

                    <label>

                        Full Name

                    </label>

                    <div className="inputBox">

                        <FaUser />

                        <input

                            type="text"

                            name="fullName"

                            placeholder="Dr Rahul Sharma"

                            value={formData.fullName}

                            onChange={handleChange}

                            required

                        />

                    </div>

                </div>

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

                {/* Role */}

                <div className="inputGroup">

                    <label>

                        Role

                    </label>

                    <div className="inputBox">

                        <FaUserTag />

                        <select

                            name="role"

                            value={formData.role}

                            onChange={handleChange}

                        >

                            <option value="Doctor">

                                Doctor

                            </option>

                            <option value="Administrator">

                                Administrator

                            </option>

                        </select>

                    </div>

                </div>

                {/* Password */}

                <PasswordInput

                    name="password"

                    value={formData.password}

                    onChange={handleChange}

                    placeholder="Create Password"

                />

                {/* Confirm Password */}

                <PasswordInput

                    name="confirmPassword"

                    value={formData.confirmPassword}

                    onChange={handleChange}

                    placeholder="Confirm Password"

                />

                {/* Register Button */}

                <button

                    type="submit"

                    className="registerBtn"

                    disabled={loading}

                >

                    {

                        loading

                        ?

                        "Creating Account..."

                        :

                        <>

                            <FaUserPlus />

                            Register

                        </>

                    }

                </button>

                {/* Login Link */}

                <div className="loginLink">

                    Already have an account?

                    <Link to="/login">

                        Login

                    </Link>

                </div>

            </form>

        </AuthLayout>

    );

}