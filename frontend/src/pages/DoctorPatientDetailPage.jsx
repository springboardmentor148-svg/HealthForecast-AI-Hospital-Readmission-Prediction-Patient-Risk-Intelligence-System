import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUserInjured,
  FaChartLine,
  FaClipboardCheck,
  FaNotesMedical,
} from "react-icons/fa6";
import { fetchPatientById } from "../services/patientsApi.js";

export function DoctorPatientDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPatient() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchPatientById(patientId);
        if (isMounted) {
          setPatient(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Patient not found.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPatient();
    return () => {
      isMounted = false;
    };
  }, [patientId]);

  if (isLoading) {
    return (
      <section className="dashboard-panel dashboard-panel-wide">
        <p>Loading patient record...</p>
      </section>
    );
  }

  if (error || !patient) {
    return (
      <section className="dashboard-panel dashboard-panel-wide">
        <h2>Patient Not Found</h2>
        <p>We couldn't find a record for patient ID: {patientId}</p>
        <button type="button" className="secondary-button" onClick={() => navigate("/app/doctor/patients")}>
          <FaArrowLeft /> Back to My Patients
        </button>
      </section>
    );
  }

  return (
    <>
      <button
        type="button"
        className="secondary-button"
        style={{ marginBottom: "16px" }}
        onClick={() => navigate("/app/doctor/patients")}
      >
        <FaArrowLeft /> Back to My Patients
      </button>

      <section className="dashboard-hero-card">
        <div>
          <span className="dashboard-eyebrow">Patient Record — {patient.patientId}</span>
          <h1>{patient.name}</h1>
          <p>
            {patient.age} yrs · {patient.gender} · {patient.condition}
          </p>
        </div>

        <div className="dashboard-hero-metric">
          <strong className={patient.riskLevel === "High" ? "risk-pill high" : "risk-pill low"}>
            {patient.riskLevel} Risk
          </strong>
          <span>
            Readmission Probability:{" "}
            {patient.readmissionProbability
              ? `${parseFloat(patient.readmissionProbability).toFixed(1)}%`
              : "Not assessed"}
          </span>
        </div>
      </section>

      <section className="dashboard-card-grid">
        <article className="dashboard-metric-card">
          <div className="metric-icon"><FaUserInjured /></div>
          <span>Admission Date</span>
          <strong>{patient.admissionDate || "—"}</strong>
        </article>
        <article className="dashboard-metric-card">
          <div className="metric-icon"><FaChartLine /></div>
          <span>Readmission Probability</span>
          <strong>
            {patient.readmissionProbability
              ? `${parseFloat(patient.readmissionProbability).toFixed(1)}%`
              : "N/A"}
          </strong>
        </article>
        <article className="dashboard-metric-card">
          <div className="metric-icon"><FaClipboardCheck /></div>
          <span>Model Confidence</span>
          <strong>
            {patient.confidence
              ? `${parseFloat(patient.confidence).toFixed(1)}%`
              : "N/A"}
          </strong>
        </article>
        <article className="dashboard-metric-card">
          <div className="metric-icon"><FaNotesMedical /></div>
          <span>Last Visit</span>
          <strong>{patient.lastVisit || "—"}</strong>
        </article>
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel">
          <h2>Medical History</h2>
          <ul className="notification-list">
            {patient.medicalHistory.length === 0 && (
              <li className="notification-item"><p>No medical history recorded.</p></li>
            )}
            {patient.medicalHistory.map((item, index) => (
              <li key={index} className="notification-item">
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="dashboard-content-grid" style={{ marginTop: "22px" }}>
        <article className="dashboard-panel">
          <h2>Contact & Emergency Info</h2>
          <ul className="notification-list">
            <li className="notification-item"><p><strong>Contact:</strong> {patient.contactNumber || "Not recorded"}</p></li>
            <li className="notification-item"><p><strong>Address:</strong> {patient.address || "Not recorded"}</p></li>
            <li className="notification-item"><p><strong>Emergency Contact:</strong> {patient.emergencyContactName || "—"} ({patient.emergencyContactNumber || "—"})</p></li>
            <li className="notification-item"><p><strong>Blood Group:</strong> {patient.bloodGroup || "Not recorded"}</p></li>
          </ul>
        </article>

        <article className="dashboard-panel">
          <h2>Clinical Details</h2>
          <ul className="notification-list">
            <li className="notification-item"><p><strong>Department:</strong> {patient.admittingDepartment || "Not recorded"}</p></li>
            <li className="notification-item"><p><strong>Discharge Date:</strong> {patient.dischargeDate || "Not discharged yet"}</p></li>
            <li className="notification-item"><p><strong>Allergies:</strong> {patient.allergies || "None recorded"}</p></li>
            <li className="notification-item"><p><strong>Current Medications:</strong> {patient.currentMedications || "None recorded"}</p></li>
          </ul>
        </article>
      </section>
    </>
  );
}