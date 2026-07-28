import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUserInjured,
  FaChartLine,
  FaClipboardCheck,
  FaNotesMedical,
} from "react-icons/fa6";

// Step 1: Dummy patient database (baad me API se ek hi patient fetch hoga id ke through)
// NOTE: Yeh saare 6 patients DoctorPatientsPage.jsx ki assignedPatients list se match karte hain
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
  "PT-1003": {
    name: "S. Williams",
    age: 71,
    gender: "Male",
    condition: "Heart Failure",
    admissionDate: "14 Jul 2026",
    lastVisit: "20 Jul 2026",
    riskLevel: "High",
    readmissionProbability: "85%",
    confidence: "93%",
    medicalHistory: [
      "Diagnosed with congestive heart failure in 2020",
      "Hospitalized twice in the last 6 months for fluid overload",
      "Currently on diuretics and beta-blockers",
    ],
    careRecommendations: [
      "Schedule follow-up within 3 days of discharge",
      "Daily weight monitoring, report gain of 2+ kg immediately",
      "Refer to cardiology for medication review",
    ],
  },
  "PT-1004": {
    name: "R. Gomez",
    age: 49,
    gender: "Male",
    condition: "Type 2 Diabetes",
    admissionDate: "12 Jul 2026",
    lastVisit: "18 Jul 2026",
    riskLevel: "Low",
    readmissionProbability: "19%",
    confidence: "80%",
    medicalHistory: [
      "Diagnosed with Type 2 Diabetes in 2022",
      "Well-controlled with oral medication, no recent complications",
    ],
    careRecommendations: [
      "Routine follow-up in 30 days",
      "Continue current diet and medication plan",
    ],
  },
  "PT-1005": {
    name: "L. Chen",
    age: 66,
    gender: "Female",
    condition: "COPD",
    admissionDate: "10 Jul 2026",
    lastVisit: "15 Jul 2026",
    riskLevel: "High",
    readmissionProbability: "81%",
    confidence: "89%",
    medicalHistory: [
      "Diagnosed with COPD in 2017, former smoker",
      "Hospitalized for acute exacerbation in June 2026",
      "On long-term oxygen therapy",
    ],
    careRecommendations: [
      "Schedule follow-up within 5 days of discharge",
      "Pulmonary rehabilitation referral",
      "Review inhaler technique and adherence",
    ],
  },
  "PT-1006": {
    name: "K. Brown",
    age: 54,
    gender: "Female",
    condition: "Hypertension",
    admissionDate: "05 Jul 2026",
    lastVisit: "12 Jul 2026",
    riskLevel: "Low",
    readmissionProbability: "16%",
    confidence: "78%",
    medicalHistory: [
      "Diagnosed with Hypertension in 2023",
      "Blood pressure stable on current medication",
    ],
    careRecommendations: [
      "Routine follow-up in 30 days",
      "Continue lifestyle modifications (low-sodium diet, exercise)",
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