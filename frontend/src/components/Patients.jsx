import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import "../styles/Patients.css";

function Patients() {
  const navigate = useNavigate();

  const [patients] = useState([
    {
      id: 1,
      name: "John Smith",
      age: 65,
      gender: "Male",
      diagnosis: "Diabetes",
      status: "High Risk",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      age: 54,
      gender: "Female",
      diagnosis: "Hypertension",
      status: "Low Risk",
    },
    {
      id: 3,
      name: "David Wilson",
      age: 71,
      gender: "Male",
      diagnosis: "Heart Disease",
      status: "Medium Risk",
    },
  ]);

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="main-content">
        <div className="page-header">
          <h1>Patients</h1>

          <button
            className="add-btn"
            onClick={() => navigate("/add-patient")}
          >
            + Add Patient
          </button>
        </div>

        <table className="patients-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Diagnosis</th>
              <th>Risk Status</th>
            </tr>
          </thead>

          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td>{patient.id}</td>
                <td>{patient.name}</td>
                <td>{patient.age}</td>
                <td>{patient.gender}</td>
                <td>{patient.diagnosis}</td>
                <td>
                  <span
                    className={
                      patient.status === "High Risk"
                        ? "high-risk"
                        : patient.status === "Medium Risk"
                        ? "medium-risk"
                        : "low-risk"
                    }
                  >
                    {patient.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Patients;