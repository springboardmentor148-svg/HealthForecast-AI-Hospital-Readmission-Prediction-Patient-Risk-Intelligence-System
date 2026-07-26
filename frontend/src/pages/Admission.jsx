import { useState, useEffect } from "react";
import { getPatients } from "../services/patientService";
import {
    getAdmissionsByPatient,
    addAdmission,
    updateAdmission,
    deleteAdmission,
} from "../services/admissionService";

const emptyForm = {
    admission_date: "",
    discharge_date: "",
    admission_reason: "",
    ward: "",
    attending_doctor: "",
    discharge_summary: "",
};

function Admission() {
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState("");

    const [admissions, setAdmissions] = useState([]);
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
            setAdmissions([]);
            return;
        }
        fetchAdmissions(selectedPatientId);
    }, [selectedPatientId]);

    const fetchAdmissions = async (patientId) => {
        setLoading(true);
        setError("");
        try {
            const data = await getAdmissionsByPatient(patientId);
            setAdmissions(data);
        } catch (err) {
            setError("Failed to load admission history.");
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
            admission_date: record.admission_date,
            discharge_date: record.discharge_date,
            admission_reason: record.admission_reason,
            ward: record.ward,
            attending_doctor: record.attending_doctor,
            discharge_summary: record.discharge_summary,
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
                await updateAdmission(editingId, formData);
            } else {
                await addAdmission({
                    ...formData,
                    patient_id: selectedPatientId,
                });
            }
            setShowModal(false);
            fetchAdmissions(selectedPatientId);
        } catch (err) {
            alert("Failed to save admission record.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (admissionId) => {
        if (!window.confirm("Delete this admission record?")) return;

        try {
            await deleteAdmission(admissionId);
            fetchAdmissions(selectedPatientId);
        } catch (err) {
            alert("Failed to delete admission record.");
        }
    };

    return (
        <div>
            <h3 className="mb-4">Admission History</h3>

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
                    Select a patient above to view or add their admission history.
                </p>
            )}

            {selectedPatientId && (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Admission Records</h5>
                        <button className="btn btn-primary" onClick={openAddModal}>
                            + Add Admission
                        </button>
                    </div>

                    {loading && <p>Loading...</p>}
                    {error && <div className="alert alert-danger">{error}</div>}

                    {!loading && admissions.length === 0 && (
                        <p className="text-muted">No admission records yet.</p>
                    )}

                    {!loading && admissions.length > 0 && (
                        <div className="table-responsive">
                            <table className="table table-hover bg-white shadow-sm">
                                <thead className="table-light">
                                    <tr>
                                        <th>Admission Date</th>
                                        <th>Discharge Date</th>
                                        <th>Reason</th>
                                        <th>Ward</th>
                                        <th>Attending Doctor</th>
                                        <th>Discharge Summary</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admissions.map((a) => (
                                        <tr key={a._id}>
                                            <td>{a.admission_date}</td>
                                            <td>{a.discharge_date}</td>
                                            <td>{a.admission_reason}</td>
                                            <td>{a.ward}</td>
                                            <td>{a.attending_doctor}</td>
                                            <td>{a.discharge_summary}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    onClick={() => openEditModal(a)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(a._id)}
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
                                        {editingId ? "Edit Admission" : "Add Admission"}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setShowModal(false)}
                                    ></button>
                                </div>

                                <div className="modal-body">
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
                                        <label className="form-label">Admission Reason</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="admission_reason"
                                            value={formData.admission_reason}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="row">
                                        <div className="col-6 mb-2">
                                            <label className="form-label">Ward</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="ward"
                                                value={formData.ward}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-6 mb-2">
                                            <label className="form-label">Attending Doctor</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="attending_doctor"
                                                value={formData.attending_doctor}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label">Discharge Summary</label>
                                        <textarea
                                            className="form-control"
                                            name="discharge_summary"
                                            rows="3"
                                            value={formData.discharge_summary}
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

export default Admission;