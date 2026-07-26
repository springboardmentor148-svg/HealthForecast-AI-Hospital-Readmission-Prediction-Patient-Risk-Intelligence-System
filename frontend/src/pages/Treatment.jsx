import { useState, useEffect } from "react";
import { getPatients } from "../services/patientService";
import {
    getTreatmentsByPatient,
    addTreatment,
    updateTreatment,
    deleteTreatment,
} from "../services/treatmentService";

const emptyForm = {
    treatment_name: "",
    medication: "",
    dosage: "",
    start_date: "",
    end_date: "",
    status: "Ongoing",
    doctor_notes: "",
};

function Treatment() {
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState("");

    const [treatments, setTreatments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

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

    useEffect(() => {
        if (!selectedPatientId) {
            setTreatments([]);
            return;
        }
        fetchTreatments(selectedPatientId);
    }, [selectedPatientId]);

    const fetchTreatments = async (patientId) => {
        setLoading(true);
        setError("");
        try {
            const data = await getTreatmentsByPatient(patientId);
            setTreatments(data);
        } catch (err) {
            setError("Failed to load treatments.");
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (treatment) => {
        setEditingId(treatment._id);
        setFormData({
            treatment_name: treatment.treatment_name,
            medication: treatment.medication,
            dosage: treatment.dosage,
            start_date: treatment.start_date,
            end_date: treatment.end_date,
            status: treatment.status,
            doctor_notes: treatment.doctor_notes,
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
                await updateTreatment(editingId, formData);
            } else {
                await addTreatment({
                    ...formData,
                    patient_id: selectedPatientId,
                });
            }
            setShowModal(false);
            fetchTreatments(selectedPatientId);
        } catch (err) {
            alert("Failed to save treatment.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (treatmentId) => {
        if (!window.confirm("Delete this treatment record?")) return;

        try {
            await deleteTreatment(treatmentId);
            fetchTreatments(selectedPatientId);
        } catch (err) {
            alert("Failed to delete treatment.");
        }
    };

    const statusBadge = (status) => {
        if (status === "Completed") return "bg-success";
        if (status === "Ongoing") return "bg-primary";
        if (status === "Discontinued") return "bg-secondary";
        return "bg-light text-dark";
    };

    return (
        <div>
            <h3 className="mb-4">Treatment</h3>

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
                    Select a patient above to view or add their treatments.
                </p>
            )}

            {selectedPatientId && (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Treatment Records</h5>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            + Add Treatment
                        </button>
                    </div>

                    {loading && <p>Loading...</p>}
                    {error && <div className="alert alert-danger">{error}</div>}

                    {!loading && treatments.length === 0 && (
                        <p className="text-muted">No treatment records yet.</p>
                    )}

                    {!loading && treatments.length > 0 && (
                        <div className="table-responsive">
                            <table className="table table-hover bg-white shadow-sm">
                                <thead className="table-light">
                                    <tr>
                                        <th>Treatment</th>
                                        <th>Medication</th>
                                        <th>Dosage</th>
                                        <th>Start</th>
                                        <th>End</th>
                                        <th>Status</th>
                                        <th>Notes</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {treatments.map((t) => (
                                        <tr key={t._id}>
                                            <td>{t.treatment_name}</td>
                                            <td>{t.medication}</td>
                                            <td>{t.dosage}</td>
                                            <td>{t.start_date}</td>
                                            <td>{t.end_date}</td>
                                            <td>
                                                <span className={`badge ${statusBadge(t.status)}`}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td>{t.doctor_notes}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    onClick={() => openEditModal(t)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(t._id)}
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
                                        {editingId ? "Edit Treatment" : "Add Treatment"}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowModal(false)}
                                    ></button>
                                </div>

                                <div className="modal-body">
                                    <div className="mb-2">
                                        <label className="form-label">Treatment Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="treatment_name"
                                            value={formData.treatment_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="row">
                                        <div className="col-6 mb-2">
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
                                        <div className="col-6 mb-2">
                                            <label className="form-label">Dosage</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. 500mg twice daily"
                                                name="dosage"
                                                value={formData.dosage}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-6 mb-2">
                                            <label className="form-label">Start Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="start_date"
                                                value={formData.start_date}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-6 mb-2">
                                            <label className="form-label">End Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="end_date"
                                                value={formData.end_date}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-select"
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="Ongoing">Ongoing</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Discontinued">Discontinued</option>
                                        </select>
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label">Doctor's Notes</label>
                                        <textarea
                                            className="form-control"
                                            name="doctor_notes"
                                            rows="3"
                                            value={formData.doctor_notes}
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

export default Treatment;