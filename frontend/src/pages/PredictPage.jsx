import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  containerStyle, 
  headerStyle, 
  subTextStyle, 
  sectionBoxStyle, 
  inputStyle, 
  primaryBtnStyle 
} from "../styles";

export default function PredictPage() {
  const [formData, setFormData] = useState({
    patient_code: "PAT-1001",
    full_name: "Jane Doe",
    age: 68,
    gender: "Female",
    number_inpatient: 0,
    discharge_disposition_id: 1,
    number_emergency: 0,
    number_diagnoses: 4,
    diabetesMed: "Yes",
    number_outpatient: 0,
    admission_source_id: 1,
    age_group: "60-70",
    diag_1_Diabetes: "No",
    metformin: "No",
    admission_type_id: 1,
    num_procedures: 1,
    race_Asian: "No"
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Preserve latest prediction output across tab navigation
  useEffect(() => {
    const savedResult = localStorage.getItem("latest_assessment");
    if (savedResult) {
      try {
        setResult(JSON.parse(savedResult));
      } catch (err) {
        console.error("Cache parsing error:", err);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age, 10),
        number_inpatient: parseInt(formData.number_inpatient, 10),
        discharge_disposition_id: parseInt(formData.discharge_disposition_id, 10),
        number_emergency: parseInt(formData.number_emergency, 10),
        number_diagnoses: parseInt(formData.number_diagnoses, 10),
        number_outpatient: parseInt(formData.number_outpatient, 10),
        admission_source_id: parseInt(formData.admission_source_id, 10),
        admission_type_id: parseInt(formData.admission_type_id, 10),
        num_procedures: parseInt(formData.num_procedures, 10)
      };

      const res = await axios.post("http://127.0.0.1:8000/api/predict", payload);
      setResult(res.data);
      localStorage.setItem("latest_assessment", JSON.stringify(res.data));
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed. Verify API connection.");
    } finally {
      setLoading(false);
    }
  };

  const labelStyle = { fontWeight: "600", marginBottom: "6px", display: "block", fontSize: "14px", color: "#334155" };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2>Readmission Risk Assessment</h2>
        <p style={subTextStyle}>Evaluate clinical parameters and calculate real-time patient risk levels.</p>
      </header>

      <div style={sectionBoxStyle}>
        <form onSubmit={handlePredict} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          
          {/* Patient Identification */}
          <div>
            <label style={labelStyle}>Patient Code:</label>
            <input type="text" name="patient_code" value={formData.patient_code} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Full Name:</label>
            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Age:</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Gender:</label>
            <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Clinical Features */}
          <div>
            <label style={labelStyle}>Number Inpatient Visits:</label>
            <input type="number" name="number_inpatient" value={formData.number_inpatient} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Discharge Disposition ID:</label>
            <input type="number" name="discharge_disposition_id" value={formData.discharge_disposition_id} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Number Emergency Visits:</label>
            <input type="number" name="number_emergency" value={formData.number_emergency} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Number Diagnoses:</label>
            <input type="number" name="number_diagnoses" value={formData.number_diagnoses} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Diabetes Medication Prescribed?</label>
            <select name="diabetesMed" value={formData.diabetesMed} onChange={handleChange} style={inputStyle}>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Number Outpatient Visits:</label>
            <input type="number" name="number_outpatient" value={formData.number_outpatient} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Admission Source ID:</label>
            <input type="number" name="admission_source_id" value={formData.admission_source_id} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Age Group:</label>
            <select name="age_group" value={formData.age_group} onChange={handleChange} style={inputStyle}>
              <option value="60-70">60-70</option>
              <option value="70-80">70-80</option>
              <option value="80-90">80-90</option>
              <option value="30-40">30-40</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Primary Diagnosis Diabetes?</label>
            <select name="diag_1_Diabetes" value={formData.diag_1_Diabetes} onChange={handleChange} style={inputStyle}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Metformin Prescribed?</label>
            <select name="metformin" value={formData.metformin} onChange={handleChange} style={inputStyle}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Admission Type ID:</label>
            <input type="number" name="admission_type_id" value={formData.admission_type_id} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Number Procedures:</label>
            <input type="number" name="num_procedures" value={formData.num_procedures} onChange={handleChange} required style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Race Asian?</label>
            <select name="race_Asian" value={formData.race_Asian} onChange={handleChange} style={inputStyle}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div style={{ gridColumn: "span 2", marginTop: "10px" }}>
            <button type="submit" disabled={loading} style={{ ...primaryBtnStyle, width: "100%", padding: "14px" }}>
              {loading ? "Calculating Assessment..." : "Run Assessment & Save Record"}
            </button>
          </div>
        </form>

        {error && <p style={{ color: "#ef4444", textAlign: "center", marginTop: "20px" }}>{error}</p>}

        {result && (
          <div style={{ marginTop: "30px", padding: "20px", border: "1px solid #0284c7", borderRadius: "8px", backgroundColor: "#f0f9ff", textAlign: "center" }}>
            <h3>Assessment Result</h3>
            <p style={{ fontSize: "16px", margin: "8px 0" }}>
              <strong>Patient Code:</strong> {result.patient_code} ({result.full_name})
            </p>
            <p style={{ fontSize: "18px", margin: "8px 0" }}>
              <strong>Risk Level:</strong> <span style={{ color: result.risk_level === "High Risk" ? "#dc2626" : "#16a34a", fontWeight: "bold" }}>{result.risk_level}</span>
            </p>
            <p style={{ fontSize: "18px", margin: "8px 0" }}>
              <strong>Readmission Probability:</strong> {result.risk_percentage}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}