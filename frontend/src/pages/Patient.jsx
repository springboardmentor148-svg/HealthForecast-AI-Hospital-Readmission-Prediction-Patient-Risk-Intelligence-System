import { useState, useEffect } from "react";
import {
    getPatients,
    addPatient,
    updatePatient,
    deletePatient,
} from "../services/patientService";

const emptyForm = {
    patient_name: "",
    age: "",
    gender: "Male",
    diagnosis: "",
    glucose_level: "",
    blood_pressure: "",
    bmi: "",
    insulin: "",
    diabetes_med: "Yes",
};

function Patient() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const loadPatients = async () => {
        setLoading(true);
        try {
            const data = await getPatients();
            setPatients(data);
        } catch (err) {
            setError("Failed to load patients.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPatients();
    }, []);

    const openAddForm = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setFormError("");
        setShowForm(true);
    };

    const openEditForm = (patient) => {
        setEditingId(patient._id);
        setFormData({
            patient_name: patient.patient_name,
            age: patient.age,
            gender: patient.gender,
            diagnosis: patient.diagnosis,
            glucose_level: patient.glucose_level,
            blood_pressure: patient.blood_pressure,
            bmi: patient.bmi,
            insulin: patient.insulin,
            diabetes_med: patient.diabetes_med,
        });
        setFormError("");
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        setSaving(true);

        // Convert numeric fields from string (form inputs) to numbers
        const payload = {
            ...formData,
            age: Number(formData.age),
            glucose_level: Number(formData.glucose_level),
            bmi: Number(formData.bmi),
            insulin: Number(formData.insulin),
        };

        try {
            if (editingId) {
                await updatePatient(editingId, payload);
            } else {
                await addPatient(payload);
            }

            closeForm();
            loadPatients();
        } catch (err) {
            setFormError(
                err.response?.data?.detail || "Failed to save patient."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (patientId) => {
        if (!window.confirm("Delete this patient record?")) return;

        try {
            await deletePatient(patientId);
            loadPatients();
        } catch (err) {
            alert("Failed to delete patient.");
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="mb-0">Patients</h3>
                <button className="btn btn-primary" onClick={openAddForm}>
                    + Add Patient
                </button>
            </div>

            {loading && <div className="text-center mt-5">Loading patients...</div>}

            {error && <div className="alert alert-danger">{error}</div>}

            {!loading && !error && patients.length === 0 && (
                <div className="text-center text-muted mt-5">
                    No patients yet. Click "Add Patient" to create one.
                </div>
            )}

            {!loading && patients.length > 0 && (
                <div className="table-responsive">
                    <table className="table table-hover align-middle bg-white shadow-sm">
                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Age</th>
                                <th>Gender</th>
                                <th>Diagnosis</th>
                                <th>Glucose</th>
                                <th>BP</th>
                                <th>BMI</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((p) => (
                                <tr key={p._id}>
                                    <td>{p.patient_name}</td>
                                    <td>{p.age}</td>
                                    <td>{p.gender}</td>
                                    <td>{p.diagnosis}</td>
                                    <td>{p.glucose_level}</td>
                                    <td>{p.blood_pressure}</td>
                                    <td>{p.bmi}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-primary me-2"
                                            onClick={() => openEditForm(p)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDelete(p._id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add / Edit form panel */}
            {showForm && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
                >
                    <div
                        className="card shadow p-4"
                        style={{ width: "500px", maxHeight: "90vh", overflowY: "auto" }}
                    >
                        <h4 className="mb-3">
                            {editingId ? "Edit Patient" : "Add Patient"}
                        </h4>

                        {formError && (
                            <div className="alert alert-danger">{formError}</div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-2">
                                <label className="form-label">Patient Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="patient_name"
                                    value={formData.patient_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="row">
                                <div className="col-6 mb-2">
                                    <label className="form-label">Age</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="age"
                                        value={formData.age}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-6 mb-2">
                                    <label className="form-label">Gender</label>
                                    <select
                                        className="form-select"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-2">
                                <label className="form-label">Diagnosis</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="diagnosis"
                                    value={formData.diagnosis}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="row">
                                <div className="col-6 mb-2">
                                    <label className="form-label">Glucose Level</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="form-control"
                                        name="glucose_level"
                                        value={formData.glucose_level}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-6 mb-2">
                                    <label className="form-label">Blood Pressure</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. 120/80"
                                        name="blood_pressure"
                                        value={formData.blood_pressure}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-6 mb-2">
                                    <label className="form-label">BMI</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="form-control"
                                        name="bmi"
                                        value={formData.bmi}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-6 mb-2">
                                    <label className="form-label">Insulin</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="form-control"
                                        name="insulin"
                                        value={formData.insulin}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Diabetes Medication</label>
                                <select
                                    className="form-select"
                                    name="diabetes_med"
                                    value={formData.diabetes_med}
                                    onChange={handleChange}
                                >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-grow-1"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save"}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary flex-grow-1"
                                    onClick={closeForm}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Patient;