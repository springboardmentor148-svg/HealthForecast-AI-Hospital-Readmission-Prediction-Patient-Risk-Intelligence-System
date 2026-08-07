import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { inputStyle, primaryBtnStyle } from "../styles";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await axios.post("http://127.0.0.1:8000/api/auth/register", {
        username,
        email,
        password
      });
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Try a different username/email.");
    }
  };

  return (
    <div style={{ maxWidth: "420px", margin: "80px auto", padding: "32px", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", backgroundColor: "#ffffff" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#0f172a" }}>Create an Account</h2>
      
      {error && <p style={{ color: "#ef4444", textAlign: "center", marginBottom: "15px", fontSize: "14px" }}>{error}</p>}
      {success && <p style={{ color: "#16a34a", textAlign: "center", marginBottom: "15px", fontSize: "14px" }}>{success}</p>}
      
      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
        <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
        
        <button type="submit" style={primaryBtnStyle}>Sign Up</button>
      </form>
      
      <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#64748b" }}>
        Already have an account? <Link to="/login" style={{ color: "#0284c7", fontWeight: "600", textDecoration: "none" }}>Log in here</Link>
      </p>
    </div>
  );
}