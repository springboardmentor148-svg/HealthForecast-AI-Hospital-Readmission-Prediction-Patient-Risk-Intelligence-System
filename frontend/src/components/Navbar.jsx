import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getLinkStyle = ({ isActive }) => ({
    color: isActive ? "#38bdf8" : "#f8fafc",
    textDecoration: "none",
    fontWeight: isActive ? "700" : "500",
    borderBottom: isActive ? "2px solid #38bdf8" : "2px solid transparent",
    paddingBottom: "4px",
    transition: "all 0.2s ease-in-out"
  });

  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "15px 30px", background: "#0f172a", color: "white" }}>
      <div style={{ fontWeight: "bold", fontSize: "20px", color: "#38bdf8" }}>HealthForecast AI</div>
      <div style={{ display: "flex", gap: "20px" }}>
        <NavLink to="/dashboard" style={getLinkStyle}>Dashboard</NavLink>
        <NavLink to="/patients" style={getLinkStyle}>Patient Search</NavLink>
        <NavLink to="/predict" style={getLinkStyle}>Risk Prediction</NavLink>
        <NavLink to="/analytics" style={getLinkStyle}>Analytics</NavLink>
        <NavLink to="/reports" style={getLinkStyle}>Reports</NavLink>
        <NavLink to="/settings" style={getLinkStyle}>Settings</NavLink>
      </div>
      <button onClick={handleLogout} style={{ background: "#ef4444", color: "white", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
        Logout
      </button>
    </nav>
  );
}

export default Navbar;