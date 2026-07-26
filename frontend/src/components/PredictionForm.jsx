import { useState, useEffect, useRef } from "react";
import { predictPatient } from "../services/predictionService";
import { getPatients } from "../services/patientService";
import PredictionResult from "./PredictionResult";

function PredictionForm() {

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const resultRef = useRef(null);

    // Optional link to an existing patient record
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState("");

    // Toggles the "Other / Less Common Medications" collapsible section
    const [showMoreMeds, setShowMoreMeds] = useState(false);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const data = await getPatients();
                setPatients(data);
            } catch (err) {
                console.error("Failed to load patients:", err);
            }
        };
        fetchPatients();
    }, []);

    // Scroll the result into view as soon as it's ready, so the doctor
    // doesn't have to manually scroll past the whole form to see it
    useEffect(() => {
        if (result && resultRef.current) {
            resultRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    }, [result]);

    const [formData, setFormData] = useState({

        // Patient Information
        race: "",
        gender: "",
        age: "",

        // Admission
        admission_type_id: 1,
        discharge_disposition_id: 1,
        admission_source_id: 1,

        // Hospital Stay
        time_in_hospital: 1,
        num_lab_procedures: 1,
        num_procedures: 0,
        num_medications: 1,

        // Previous Visits
        number_outpatient: 0,
        number_emergency: 0,
        number_inpatient: 0,

        // Diagnosis
        diag_1: "250",
        diag_2: "250",
        diag_3: "250",

        number_diagnoses: 1,

        // Medicines
        metformin: "No",
        repaglinide: "No",
        nateglinide: "No",
        chlorpropamide: "No",
        glimepiride: "No",
        acetohexamide: "No",
        glipizide: "No",
        glyburide: "No",
        tolbutamide: "No",
        pioglitazone: "No",
        rosiglitazone: "No",
        acarbose: "No",
        miglitol: "No",
        troglitazone: "No",
        tolazamide: "No",
        examide: "No",
        citoglipton: "No",
        insulin: "No",

        glyburide_metformin: "No",
        glipizide_metformin: "No",
        glimepiride_pioglitazone: "No",
        metformin_rosiglitazone: "No",
        metformin_pioglitazone: "No",

        change: "No",
        diabetesMed: "Yes"
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            setLoading(true);

            const response = await predictPatient({
                ...formData,
                patient_id: selectedPatientId || null,
            });

            setResult(response);

        } catch (error) {

            alert(
                error.response?.data?.detail ||
                "Prediction Failed"
            );

        } finally {

            setLoading(false);

        }
    };

    const races = [
        "Caucasian",
        "AfricanAmerican",
        "Asian",
        "Hispanic",
        "Other"
    ];

    const genders = [
        "Male",
        "Female"
    ];

    const ages = [
        "[0-10)",
        "[10-20)",
        "[20-30)",
        "[30-40)",
        "[40-50)",
        "[50-60)",
        "[60-70)",
        "[70-80)",
        "[80-90)",
        "[90-100)"
    ];

    const medicineOptions = [
        "No",
        "Steady",
        "Up",
        "Down"
    ];

        return (
        <>
            <form onSubmit={handleSubmit}>

                <div className="mb-4">
                    <label className="form-label fw-bold">
                        Link to Existing Patient (optional)
                    </label>
                    <select
                        className="form-select"
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                    >
                        <option value="">
                            -- Ad-hoc prediction (not linked to a patient) --
                        </option>
                        {patients.map((p) => (
                            <option key={p._id} value={p._id}>
                                {p.patient_name} ({p.age}, {p.gender})
                            </option>
                        ))}
                    </select>
                    <small className="text-muted">
                        Linking updates that patient's record with their
                        latest risk result, visible on the Patients page.
                    </small>
                </div>


                {/* Patient Information */}

                <div className="card mb-4">
                    <div className="card-header">
                        <h4>Patient Information</h4>
                    </div>

                    <div className="card-body">

                        <div className="row">

                            <div className="col-md-4 mb-3">
                                <label>Race</label>

                                <select
                                    className="form-select"
                                    name="race"
                                    value={formData.race}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Race</option>

                                    {races.map((race) => (
                                        <option key={race} value={race}>
                                            {race}
                                        </option>
                                    ))}

                                </select>
                            </div>

                            <div className="col-md-4 mb-3">
                                <label>Gender</label>

                                <select
                                    className="form-select"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                >

                                    <option value="">Select Gender</option>

                                    {genders.map((gender) => (
                                        <option key={gender} value={gender}>
                                            {gender}
                                        </option>
                                    ))}

                                </select>

                            </div>

                            <div className="col-md-4 mb-3">

                                <label>Age Group</label>

                                <select
                                    className="form-select"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                >

                                    <option value="">Select Age</option>

                                    {ages.map((age) => (
                                        <option key={age} value={age}>
                                            {age}
                                        </option>
                                    ))}

                                </select>

                            </div>

                        </div>

                    </div>
                </div>

                {/* Admission Information */}

                <div className="card mb-4">

                    <div className="card-header">
                        <h4>Admission Information</h4>
                    </div>

                    <div className="card-body">

                        <div className="row">

                            <div className="col-md-4 mb-3">

                                <label>Admission Type ID</label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="admission_type_id"
                                    value={formData.admission_type_id}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="col-md-4 mb-3">

                                <label>Discharge Disposition ID</label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="discharge_disposition_id"
                                    value={formData.discharge_disposition_id}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="col-md-4 mb-3">

                                <label>Admission Source ID</label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="admission_source_id"
                                    value={formData.admission_source_id}
                                    onChange={handleChange}
                                />

                            </div>

                        </div>

                    </div>

                </div>

                {/* Hospital Stay */}

                <div className="card mb-4">

                    <div className="card-header">
                        <h4>Hospital Stay</h4>
                    </div>

                    <div className="card-body">

                        <div className="row">

                            <div className="col-md-3 mb-3">

                                <label>Time in Hospital</label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="time_in_hospital"
                                    value={formData.time_in_hospital}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="col-md-3 mb-3">

                                <label>Lab Procedures</label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="num_lab_procedures"
                                    value={formData.num_lab_procedures}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="col-md-3 mb-3">

                                <label>Procedures</label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="num_procedures"
                                    value={formData.num_procedures}
                                    onChange={handleChange}
                                />

                            </div>

                            <div className="col-md-3 mb-3">

                                <label>Medications</label>

                                <input
                                    type="number"
                                    className="form-control"
                                    name="num_medications"
                                    value={formData.num_medications}
                                    onChange={handleChange}
                                />

                            </div>

                        </div>

                    </div>

                </div>

                                {/* Previous Visits */}

                <div className="card mb-4">
                    <div className="card-header">
                        <h4>Previous Hospital Visits</h4>
                    </div>

                    <div className="card-body">

                        <div className="row">

                            <div className="col-md-4 mb-3">
                                <label>Outpatient Visits</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="number_outpatient"
                                    value={formData.number_outpatient}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-4 mb-3">
                                <label>Emergency Visits</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="number_emergency"
                                    value={formData.number_emergency}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-4 mb-3">
                                <label>Inpatient Visits</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="number_inpatient"
                                    value={formData.number_inpatient}
                                    onChange={handleChange}
                                />
                            </div>

                        </div>

                    </div>
                </div>


                {/* Diagnosis */}

                <div className="card mb-4">

                    <div className="card-header">
                        <h4>Diagnosis Information</h4>
                    </div>

                    <div className="card-body">

                        <div className="row">

                            <div className="col-md-3 mb-3">
                                <label>Diagnosis 1</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="diag_1"
                                    value={formData.diag_1}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-3 mb-3">
                                <label>Diagnosis 2</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="diag_2"
                                    value={formData.diag_2}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-3 mb-3">
                                <label>Diagnosis 3</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="diag_3"
                                    value={formData.diag_3}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-3 mb-3">
                                <label>Total Diagnoses</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="number_diagnoses"
                                    value={formData.number_diagnoses}
                                    onChange={handleChange}
                                />
                            </div>

                        </div>

                    </div>

                </div>


                {/* Diabetes Medicines */}

                <div className="card mb-4">

                    <div className="card-header">
                        <h4>Diabetes Medication</h4>
                    </div>

                    <div className="card-body">

                        <p className="text-muted small mb-3">
                            Common Medications
                        </p>

                        <div className="row">

                            {[
                                "metformin",
                                "glipizide",
                                "glyburide",
                                "pioglitazone",
                                "rosiglitazone",
                                "insulin",
                            ].map((field) => (

                                <div className="col-md-4 mb-3" key={field}>

                                    <label>
                                        {field.replaceAll("_", " ")}
                                    </label>

                                    <select
                                        className="form-select"
                                        name={field}
                                        value={formData[field]}
                                        onChange={handleChange}
                                    >

                                        {medicineOptions.map((option) => (

                                            <option
                                                key={option}
                                                value={option}
                                            >
                                                {option}
                                            </option>

                                        ))}

                                    </select>

                                </div>

                            ))}

                        </div>

                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary mb-3"
                            onClick={() => setShowMoreMeds(!showMoreMeds)}
                        >
                            {showMoreMeds
                                ? "Hide Other Medications"
                                : "Show Other / Less Common Medications (17)"}
                        </button>

                        {showMoreMeds && (
                            <div className="row">

                                {[
                                    "repaglinide",
                                    "nateglinide",
                                    "chlorpropamide",
                                    "glimepiride",
                                    "acetohexamide",
                                    "tolbutamide",
                                    "acarbose",
                                    "miglitol",
                                    "troglitazone",
                                    "tolazamide",
                                    "examide",
                                    "citoglipton",
                                    "glyburide_metformin",
                                    "glipizide_metformin",
                                    "glimepiride_pioglitazone",
                                    "metformin_rosiglitazone",
                                    "metformin_pioglitazone",
                                ].map((field) => (

                                    <div className="col-md-4 mb-3" key={field}>

                                        <label>
                                            {field.replaceAll("_", " ")}
                                        </label>

                                        <select
                                            className="form-select"
                                            name={field}
                                            value={formData[field]}
                                            onChange={handleChange}
                                        >

                                            {medicineOptions.map((option) => (

                                                <option
                                                    key={option}
                                                    value={option}
                                                >
                                                    {option}
                                                </option>

                                            ))}

                                        </select>

                                    </div>

                                ))}

                            </div>
                        )}

                        <hr className="my-3" />

                        <div className="row">

                            <div className="col-md-4 mb-3">
                                <label>Medication Changed During Stay</label>
                                <select
                                    className="form-select"
                                    name="change"
                                    value={formData.change}
                                    onChange={handleChange}
                                >
                                    <option value="No">No</option>
                                    <option value="Ch">Changed</option>
                                </select>
                            </div>

                            <div className="col-md-4 mb-3">
                                <label>On Diabetes Medication</label>
                                <select
                                    className="form-select"
                                    name="diabetesMed"
                                    value={formData.diabetesMed}
                                    onChange={handleChange}
                                >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>

                        </div>

                    </div>

                </div>


                <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                >
                    {loading ? "Predicting..." : "Predict Readmission"}
                </button>

            </form>

            <div ref={resultRef}>
                <PredictionResult result={result} />
            </div>

        </>
    );

}

export default PredictionForm;