import React, { useState } from "react";
import Sidebar from "./Sidebar";
import "../styles/AddPatient.css";

function AddPatient() {
  const [patient, setPatient] = useState({
    name: "",
    age: "",
    gender: "",
    diagnosis: "",
    admissionDate: "",
    phone: "",
  });

  const handleChange = (e) => {
    setPatient({
      ...patient,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    alert("Patient Added Successfully!");

    console.log(patient);

    setPatient({
      name: "",
      age: "",
      gender: "",
      diagnosis: "",
      admissionDate: "",
      phone: "",
    });
  };

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="main-content">
        <div className="add-patient-container">
          <h1>Add Patient</h1>

          <form onSubmit={handleSubmit} className="patient-form">

            <input
              type="text"
              name="name"
              placeholder="Patient Name"
              value={patient.name}
              onChange={handleChange}
              required
            />

            <input
              type="number"
              name="age"
              placeholder="Age"
              value={patient.age}
              onChange={handleChange}
              required
            />

            <select
              name="gender"
              value={patient.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <input
              type="text"
              name="diagnosis"
              placeholder="Diagnosis"
              value={patient.diagnosis}
              onChange={handleChange}
              required
            />

            <input
              type="date"
              name="admissionDate"
              value={patient.admissionDate}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={patient.phone}
              onChange={handleChange}
              required
            />

            <button type="submit" className="save-btn">
              Save Patient
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

export default AddPatient;