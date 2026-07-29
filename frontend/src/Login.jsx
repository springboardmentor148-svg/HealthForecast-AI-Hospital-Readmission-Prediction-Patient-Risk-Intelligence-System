import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./styles/Login.css";
import logo from "./assets/logo.png";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Please enter Username and Password");
      return;
    }

    // Save logged-in user details
    localStorage.setItem(
      "user",
      JSON.stringify({
        name: username,
      })
    );

    alert("Login Successful");
    navigate("/dashboard");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img
          src={logo}
          alt="HealthForecast AI Logo"
          className="logo"
        />

        <h1 className="title">HealthForecast AI</h1>

        <p className="subtitle">
          Hospital Readmission Prediction & Patient Risk Intelligence System
        </p>

        <h2 className="heading">Welcome Back</h2>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Login</button>
        </form>

        <p className="register-text">
          Don't have an account?{" "}
          <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;