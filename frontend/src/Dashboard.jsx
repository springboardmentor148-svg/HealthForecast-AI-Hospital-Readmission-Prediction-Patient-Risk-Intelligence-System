import React from "react";
import "./styles/Dashboard.css";
import Sidebar from "./components/Sidebar";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {

  // Get logged-in user from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.name || "User";

  const data = {
    labels: ["High Risk", "Low Risk"],
    datasets: [
      {
        data: [0, 10],
        backgroundColor: ["#ff4d4d", "#1abc9c"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="dashboard">

      <Sidebar />

      <div className="main-content">

        <div className="header">
          <h1>Welcome, {username} 👋</h1>
          <p>
            Hospital Readmission Prediction & Patient Risk Intelligence System
          </p>
        </div>

        <div className="cards">

          <div className="card">
            <h4>Total Patients</h4>
            <h2>4</h2>
          </div>

          <div className="card">
            <h4>Total Predictions</h4>
            <h2>10</h2>
          </div>

          <div className="card danger">
            <h4>High-Risk Predictions</h4>
            <h2>0</h2>
          </div>

          <div className="card success">
            <h4>Low-Risk Predictions</h4>
            <h2>10</h2>
          </div>

        </div>

        <div className="bottom-section">

          <div className="chart-card">
            <h3>Readmission Risk Distribution</h3>

            <div className="pie">
              <Pie data={data} />
            </div>

          </div>

          <div className="action-card">

            <h3>Quick Actions</h3>

            <button className="blue">
              ➕ New Prediction
            </button>

            <button className="gray">
              📄 View History
            </button>

            <button className="orange">
              👨‍⚕️ Manage Patients
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;