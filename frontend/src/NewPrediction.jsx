import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import "./styles/NewPrediction.css";

function NewPrediction() {
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    race: "",
    admissionType: "",
    timeInHospital: "",
    numLabProcedures: "",
    numMedications: "",
    diagnoses: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePredict = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age: Number(formData.age),
          gender: formData.gender,
          race: formData.race,
          admissionType: formData.admissionType,
          timeInHospital: Number(formData.timeInHospital),
          numLabProcedures: Number(formData.numLabProcedures),
          numMedications: Number(formData.numMedications),
          diagnoses: Number(formData.diagnoses),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || data.message || "Prediction Failed");
        return;
      }

      alert("Prediction: " + data.prediction);

      setFormData({
        age: "",
        gender: "",
        race: "",
        admissionType: "",
        timeInHospital: "",
        numLabProcedures: "",
        numMedications: "",
        diagnoses: "",
      });

    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend server.");
    }
  };

  return (
    <div className="dashboard">
      <Sidebar />

      <div className="main-content">
        <h1>New Prediction</h1>

        <form className="prediction-form" onSubmit={handlePredict}>

          <input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleChange}
            required
          />

          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <input
            type="text"
            name="race"
            placeholder="Race"
            value={formData.race}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="admissionType"
            placeholder="Admission Type"
            value={formData.admissionType}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="timeInHospital"
            placeholder="Time In Hospital"
            value={formData.timeInHospital}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="numLabProcedures"
            placeholder="Number of Lab Procedures"
            value={formData.numLabProcedures}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="numMedications"
            placeholder="Number of Medications"
            value={formData.numMedications}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="diagnoses"
            placeholder="Diagnoses"
            value={formData.diagnoses}
            onChange={handleChange}
            required
          />

          <button type="submit">
            Predict Readmission Risk
          </button>

        </form>
      </div>
    </div>
  );
}

export default NewPrediction;