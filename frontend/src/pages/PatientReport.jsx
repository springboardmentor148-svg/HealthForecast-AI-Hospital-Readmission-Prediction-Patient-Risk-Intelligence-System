import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FiPrinter, FiFileText } from "react-icons/fi";
import { getPatients } from "../services/patientService";
import { getMedicalHistoryByPatient } from "../services/medicalHistoryService";
import { getTreatmentsByPatient } from "../services/treatmentService";
import { getAdmissionsByPatient } from "../services/admissionService";
import { getPredictionHistory } from "../services/predictionService";
import Spinner from "../components/Spinner";

function PatientReport() {
    const [searchParams] = useSearchParams();
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [patient, setPatient] = useState(null);

    const [medicalHistory, setMedicalHistory] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [admissions, setAdmissions] = useState([]);
    const [predictions, setPredictions] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const data = await getPatients();
                setPatients(data);

                // If navigated here with ?patientId=..., auto-select that
                // patient (e.g. from the navbar search results)
                const patientIdFromUrl = searchParams.get("patientId");
                if (patientIdFromUrl) {
                    setSelectedPatientId(patientIdFromUrl);
                }
            } catch (err) {
                setError("Failed to load patients.");
            }

        };
        fetchPatients();
    }, []);

    useEffect(() => {
        if (!selectedPatientId) return;

        const fetchReport = async () => {
            setLoading(true);
            setError("");

            try {
                const selected = patients.find((p) => p._id === selectedPatientId);
                setPatient(selected);

                const [historyData, treatmentData, admissionData, allPredictions] =
                    await Promise.all([
                        getMedicalHistoryByPatient(selectedPatientId),
                        getTreatmentsByPatient(selectedPatientId),
                        getAdmissionsByPatient(selectedPatientId),
                        getPredictionHistory(),
                    ]);

                setMedicalHistory(historyData);
                setTreatments(treatmentData);
                setAdmissions(admissionData);

                // Predictions aren't fetched per-patient on the backend, so
                // filter this doctor's full history down to this patient
                setPredictions(
                    allPredictions.filter((p) => p.patient_id === selectedPatientId)
                );
            } catch (err) {
                setError("Failed to load report data.");
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [selectedPatientId, patients]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-1 no-print">
                <h3 className="mb-0">Patient Outcome Report</h3>
                {patient && (
                    <button
                        className="btn btn-primary d-flex align-items-center gap-2"
                        onClick={handlePrint}
                    >
                        <FiPrinter size={16} /> Print / Save as PDF
                    </button>
                )}
            </div>
            <p className="text-muted mb-4 no-print">
                Consolidated medical history, treatments, admissions, and risk
                predictions for a single patient.
            </p>

            <div className="mb-4 no-print" style={{ maxWidth: "350px" }}>
                <label className="form-label">Select Patient</label>
                <select
                    className="form-select"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                    <option value="">-- Choose a patient --</option>
                    {patients.map((p) => (
                        <option key={p._id} value={p._id}>
                            {p.patient_name} ({p.age}, {p.gender})
                        </option>
                    ))}
                </select>
            </div>

            {!selectedPatientId && (
                <div className="text-center text-muted py-5 no-print">
                    <FiFileText size={40} className="mb-3 opacity-50" />
                    <p>Select a patient above to generate their outcome report.</p>
                </div>
            )}

            {loading && <Spinner text="Building report..." />}
            {error && <div className="alert alert-danger">{error}</div>}

            {!loading && patient && (
                <div id="report-content">

                    {/* Report header */}
                    <div className="border-bottom pb-3 mb-4">
                        <h4 className="mb-1">{patient.patient_name}</h4>
                        <p className="text-muted mb-2">
                            {patient.age} years · {patient.gender} · {patient.diagnosis}
                        </p>
                        <div className="d-flex gap-4 small">
                            <span>
                                <strong>Glucose:</strong> {patient.glucose_level}
                            </span>
                            <span>
                                <strong>BP:</strong> {patient.blood_pressure}
                            </span>
                            <span>
                                <strong>BMI:</strong> {patient.bmi}
                            </span>
                            <span>
                                <strong>Current Risk:</strong>{" "}
                                {patient.latest_risk_level ? (
                                    <span
                                        className={`badge ${
                                            patient.latest_risk_level.includes("High")
                                                ? "bg-danger"
                                                : "bg-success"
                                        }`}
                                    >
                                        {patient.latest_risk_level}
                                    </span>
                                ) : (
                                    "Not assessed"
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Prediction history */}
                    <div className="mb-4">
                        <h6 className="text-primary mb-2">Risk Prediction History</h6>
                        {predictions.length === 0 ? (
                            <p className="text-muted small">
                                No predictions linked to this patient yet.
                            </p>
                        ) : (
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Risk Level</th>
                                        <th>Confidence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {predictions.map((p, i) => (
                                        <tr key={i}>
                                            <td>{new Date(p.created_at).toLocaleDateString()}</td>
                                            <td>{p.result?.risk_level}</td>
                                            <td>{p.result?.confidence}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Admission history */}
                    <div className="mb-4">
                        <h6 className="text-primary mb-2">Admission History</h6>
                        {admissions.length === 0 ? (
                            <p className="text-muted small">No admission records.</p>
                        ) : (
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Admission</th>
                                        <th>Discharge</th>
                                        <th>Reason</th>
                                        <th>Ward</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admissions.map((a) => (
                                        <tr key={a._id}>
                                            <td>{a.admission_date}</td>
                                            <td>{a.discharge_date}</td>
                                            <td>{a.admission_reason}</td>
                                            <td>{a.ward}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Medical history */}
                    <div className="mb-4">
                        <h6 className="text-primary mb-2">Medical History</h6>
                        {medicalHistory.length === 0 ? (
                            <p className="text-muted small">No medical history records.</p>
                        ) : (
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Disease</th>
                                        <th>Treatment</th>
                                        <th>Medication</th>
                                        <th>Admission</th>
                                        <th>Discharge</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {medicalHistory.map((h) => (
                                        <tr key={h._id}>
                                            <td>{h.disease}</td>
                                            <td>{h.treatment}</td>
                                            <td>{h.medication}</td>
                                            <td>{h.admission_date}</td>
                                            <td>{h.discharge_date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Treatments */}
                    <div className="mb-4">
                        <h6 className="text-primary mb-2">Treatment Records</h6>
                        {treatments.length === 0 ? (
                            <p className="text-muted small">No treatment records.</p>
                        ) : (
                            <table className="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Treatment</th>
                                        <th>Medication</th>
                                        <th>Dosage</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {treatments.map((t) => (
                                        <tr key={t._id}>
                                            <td>{t.treatment_name}</td>
                                            <td>{t.medication}</td>
                                            <td>{t.dosage}</td>
                                            <td>{t.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <p className="text-muted small mt-4 pt-3 border-top">
                        Generated by HealthForecast AI on {new Date().toLocaleDateString()}
                    </p>
                </div>
            )}
        </div>
    );
}

export default PatientReport;