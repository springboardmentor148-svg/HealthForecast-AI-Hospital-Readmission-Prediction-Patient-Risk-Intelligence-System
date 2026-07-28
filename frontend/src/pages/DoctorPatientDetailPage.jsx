import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUserInjured,
  FaChartLine,
  FaClipboardCheck,
  FaNotesMedical,
} from "react-icons/fa6";

// Step 1: Dummy patient database (baad me API se ek hi patient fetch hoga id ke through)
const patientDatabase = {
  "PT-1001": {
    name: "A. Johnson",
    age: 64,
    gender: "Male",
    condition: "Type 2 Diabetes",
    admissionDate: "18 Jul 2026",
    lastVisit: "24 Jul 2026",
    riskLevel: "High",
    readmissionProbability: "78%",
    confidence: "91%",
    medicalHistory: [
      "Diagnosed with Type 2 Diabetes in 2019",
      "Hospitalized for hyperglycemia in March 2026",
      "Prescribed Metformin, dosage adjusted in June 2026",
    ],
    careRecommendations: [
      "Schedule follow-up within 7 days of discharge",
      "Monitor blood glucose levels daily for 2 weeks",
      "Refer to dietitian for meal planning support",
    ],
  },
  "PT-1002": {
    name: "M. Patel",
    age: 58,
    gender: "Female",
    condition: "Hypertension",
    admissionDate: "20 Jul 2026",
    lastVisit: "22 Jul 2026",
    riskLevel: "Low",
    readmissionProbability: "22%",
    confidence: "84%",
    medicalHistory: [
      "Diagnosed with Hypertension in 2021",
      "Stable on current medication for 8 months",
    ],
    careRecommendations: [
      "Routine follow-up in 30 days",
      "Continue current medication regimen",
    ],
  },
};

export function DoctorPatientDetailPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const patient = patientDatabase[patientId];

  // Step 2: Agar patient ID database me nahi mila (galat ID ya abhi data load nahi hua)
  if (!patient) {
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
          <span className="dashboard-eyebrow">Patient Record — {patientId}</span>
          <h1>{patient.name}</h1>
          <p>
            {patient.age} yrs · {patient.gender} · {patient.condition}
          </p>
        </div>

        <div className="dashboard-hero-metric">
          <strong className={patient.riskLevel === "High" ? "risk-pill high" : "risk-pill low"}>
            {patient.riskLevel} Risk
          </strong>
          <span>Readmission Probability: {patient.readmissionProbability}</span>
        </div>
      </section>

      <section className="dashboard-card-grid">
        <article className="dashboard-metric-card">
          <div className="metric-icon"><FaUserInjured /></div>
          <span>Admission Date</span>
          <strong>{patient.admissionDate}</strong>
        </article>
        <article className="dashboard-metric-card">
          <div className="metric-icon"><FaChartLine /></div>
          <span>Readmission Probability</span>
          <strong>{patient.readmissionProbability}</strong>
        </article>
        <article className="dashboard-metric-card">
          <div className="metric-icon"><FaClipboardCheck /></div>
          <span>Model Confidence</span>
          <strong>{patient.confidence}</strong>
        </article>
        <article className="dashboard-metric-card">
          <div className="metric-icon"><FaNotesMedical /></div>
          <span>Last Visit</span>
          <strong>{patient.lastVisit}</strong>
        </article>
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel">
          <h2>Medical History</h2>
          <ul className="notification-list">
            {patient.medicalHistory.map((item, index) => (
              <li key={index} className="notification-item">
                <p>{item}</p>
              </li>
            ))}
          </ul>
        </article>

        <aside className="dashboard-side-stack">
          <article className="dashboard-panel">
            <h2>Care Recommendations</h2>
            <ul className="notification-list">
              {patient.careRecommendations.map((item, index) => (
                <li key={index} className="notification-item">
                  <p>{item}</p>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </section>
    </>
  );
}