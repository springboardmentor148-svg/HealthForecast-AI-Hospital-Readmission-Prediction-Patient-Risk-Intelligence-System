import { useState, useEffect } from "react";
import { getPatients } from "../services/patientService";
import {
    getMedicalHistoryByPatient,
    addMedicalHistory,
    updateMedicalHistory,
    deleteMedicalHistory,
} from "../services/medicalHistoryService";

const emptyForm = {
    disease: "",
    treatment: "",
    medication: "",
    admission_date: "",
    discharge_date: "",
    notes: "",
};

function MedicalHistory() {
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState("");

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    // Load the doctor's patients for the selector
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const data = await getPatients();
                setPatients(data);
            } catch (err) {
                setError("Failed to load patients.");
            }
        };
        fetchPatients();
    }, []);

    // Load history whenever the selected patient changes
    useEffect(() => {
        if (!selectedPatientId) {
            setHistory([]);
            return;
        }
        fetchHistory(selectedPatientId);
    }, [selectedPatientId]);

    const fetchHistory = async (patientId) => {
        setLoading(true);
        setError("");
        try {
            const data = await getMedicalHistoryByPatient(patientId);
            setHistory(data);
        } catch (err) {
            setError("Failed to load medical history.");
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (record) => {
        setEditingId(record._id);
        setFormData({
            disease: record.disease,
            treatment: record.treatment,
            medication: record.medication,
            admission_date: record.admission_date,
            discharge_date: record.discharge_date,
            notes: record.notes,
        });
        setShowModal(true);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingId) {
                await updateMedicalHistory(editingId, formData);
            } else {
                await addMedicalHistory({
                    ...formData,
                    patient_id: selectedPatientId,
                });
            }
            setShowModal(false);
            fetchHistory(selectedPatientId);
        } catch (err) {
            alert("Failed to save medical history record.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (historyId) => {
        if (!window.confirm("Delete this medical history record?")) return;

        try {
            await deleteMedicalHistory(historyId);
            fetchHistory(selectedPatientId);
        } catch (err) {
            alert("Failed to delete record.");
        }
    };

    return (
        <div>
            <h3 className="mb-4">Medical History</h3>

            <div className="mb-4" style={{ maxWidth: "350px" }}>
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
                <p className="text-muted">
                    Select a patient above to view or add their medical history.
                </p>
            )}

            {selectedPatientId && (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">History Records</h5>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            + Add Record
                        </button>
                    </div>

                    {loading && <p>Loading...</p>}
                    {error && <div className="alert alert-danger">{error}</div>}

                    {!loading && history.length === 0 && (
                        <p className="text-muted">No medical history records yet.</p>
                    )}

                    {!loading && history.length > 0 && (
                        <div className="table-responsive">
                            <table className="table table-hover bg-white shadow-sm">
                                <thead className="table-light">
                                    <tr>
                                        <th>Disease</th>
                                        <th>Treatment</th>
                                        <th>Medication</th>
                                        <th>Admission</th>
                                        <th>Discharge</th>
                                        <th>Notes</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((record) => (
                                        <tr key={record._id}>
                                            <td>{record.disease}</td>
                                            <td>{record.treatment}</td>
                                            <td>{record.medication}</td>
                                            <td>{record.admission_date}</td>
                                            <td>{record.discharge_date}</td>
                                            <td>{record.notes}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    onClick={() => openEditModal(record)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(record._id)}
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
                </>
            )}

            {showModal && (
                <div
                    className="modal d-block"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <form onSubmit={handleSave}>
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        {editingId ? "Edit Record" : "Add Medical History"}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowModal(false)}
                                    ></button>
                                </div>

                                <div className="modal-body">
                                    <div className="mb-2">
                                        <label className="form-label">Disease</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="disease"
                                            value={formData.disease}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label">Treatment</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="treatment"
                                            value={formData.treatment}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label">Medication</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="medication"
                                            value={formData.medication}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="row">
                                        <div className="col-6 mb-2">
                                            <label className="form-label">Admission Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="admission_date"
                                                value={formData.admission_date}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-6 mb-2">
                                            <label className="form-label">Discharge Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="discharge_date"
                                                value={formData.discharge_date}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label">Notes</label>
                                        <textarea
                                            className="form-control"
                                            name="notes"
                                            rows="3"
                                            value={formData.notes}
                                            onChange={handleChange}
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={saving}
                                    >
                                        {saving ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MedicalHistory;