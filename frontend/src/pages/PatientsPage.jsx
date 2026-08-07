import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  containerStyle, 
  headerStyle, 
  subTextStyle, 
  sectionBoxStyle, 
  tableStyle, 
  thGroupStyle, 
  thStyle, 
  tdStyle, 
  badgeStyle, 
  inputStyle 
} from '../styles';

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async (query = '') => {
    try {
      setLoading(true);
      const res = await axios.get(`http://127.0.0.1:8000/api/patients/?query=${encodeURIComponent(query)}`);
      if (res.data && res.data.length > 0) {
        setPatients(res.data);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error("Error fetching patient records:", err);
      // Fallback demo dataset if backend API is unreachable
      setPatients([
        {
          id: 1,
          patient_code: "PAT-1001",
          full_name: "Jane Doe",
          age: 68,
          gender: "Female",
          primary_diagnosis: "Diabetes Mellitus Type II",
          latest_risk: "High Risk",
          latest_prob: "78.4%"
        },
        {
          id: 2,
          patient_code: "PAT-1002",
          full_name: "John Smith",
          age: 54,
          gender: "Male",
          primary_diagnosis: "Hypertension & Diabetes",
          latest_risk: "Low Risk",
          latest_prob: "14.2%"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPatients(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2>Patient Directory & Records Search</h2>
        <p style={subTextStyle}>Live database patient records and historical assessment tracking.</p>
      </header>

      <div style={sectionBoxStyle}>
        <input 
          type="text" 
          placeholder="Search by Patient Name or ID (e.g. PAT-1001)..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...inputStyle, marginBottom: '20px', width: '100%', padding: '12px' }}
        />

        <table style={tableStyle}>
          <thead>
            <tr style={thGroupStyle}>
              <th style={thStyle}>Patient ID</th>
              <th style={thStyle}>Full Name</th>
              <th style={thStyle}>Age</th>
              <th style={thStyle}>Gender</th>
              <th style={thStyle}>Primary Diagnosis</th>
              <th style={thStyle}>Latest Readmission Risk</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ ...tdStyle, textAlign: 'center' }}>Searching database...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan="6" style={{ ...tdStyle, textAlign: 'center' }}>No patient records found. Run a prediction to add one.</td></tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id}>
                  <td style={tdStyle}><strong>{p.patient_code}</strong></td>
                  <td style={tdStyle}>{p.full_name}</td>
                  <td style={tdStyle}>{p.age}</td>
                  <td style={tdStyle}>{p.gender}</td>
                  <td style={tdStyle}>{p.primary_diagnosis}</td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(p.latest_risk === 'High Risk')}>
                      {p.latest_risk || "Low Risk"} ({p.latest_prob || "N/A"})
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}