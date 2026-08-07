import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { inputStyle, primaryBtnStyle } from "../styles";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      const res = await axios.post("http://127.0.0.1:8000/api/auth/login", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      localStorage.setItem("token", res.data.access_token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  return (
    <div style={{ maxWidth: "420px", margin: "80px auto", padding: "32px", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", backgroundColor: "#ffffff" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#0f172a" }}>HealthForecast AI Login</h2>
      
      {error && <p style={{ color: "#ef4444", textAlign: "center", marginBottom: "15px", fontSize: "14px" }}>{error}</p>}
      
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
          style={inputStyle} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={inputStyle} 
        />
        <button type="submit" style={primaryBtnStyle}>Login</button>
      </form>
      
      <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#64748b" }}>
        Don’t have an account? <Link to="/register" style={{ color: "#0284c7", fontWeight: "600", textDecoration: "none" }}>Sign up here</Link>
      </p>
    </div>
  );
}