import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./../styles/Sidebar.css";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    alert("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <h2>HealthForecast AI</h2>
        <p>Hospital Readmission System</p>
      </div>

      <ul className="menu">
        <li className={location.pathname === "/dashboard" ? "active" : ""}>
          <Link to="/dashboard">📊 Dashboard</Link>
        </li>

        <li className={location.pathname === "/newprediction" ? "active" : ""}>
          <Link to="/newprediction">➕ New Prediction</Link>
        </li>

        <li>
          <Link to="/history">📜 Prediction History</Link>
        </li>

        <li>
          <Link to="/patients">👨‍⚕️ Patients</Link>
        </li>

        <li>
          <Link to="/medical-history">🩺 Medical History</Link>
        </li>

        <li>
          <Link to="/treatment">💊 Treatment</Link>
        </li>

        <li>
          <Link to="/admissions">🏥 Admissions</Link>
        </li>

        <li>
          <Link to="/profile">👤 Profile</Link>
        </li>
      </ul>

      <button className="logout" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Sidebar;