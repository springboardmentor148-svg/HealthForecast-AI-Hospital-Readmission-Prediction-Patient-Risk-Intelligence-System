import "./Prediction.css";

import { useState } from "react";
import { toast } from "react-hot-toast";

import predictionService from "../../services/predictionService";

import {
    FaRobot,
    FaUser,
    FaHospital,
    FaHeartbeat,
    FaArrowRight
} from "react-icons/fa";

export default function Prediction() {

    const [loading, setLoading] = useState(false);

    const [predictionResult, setPredictionResult] = useState(null);

    const [formData, setFormData] = useState({

        // ==========================
        // Patient Information
        // ==========================

        age: 60,

        gender: "Male",

        race: "Caucasian",

        medical_specialty: "InternalMedicine",

        // ==========================
        // Admission Information
        // ==========================

        admission_type_id: 1,

        discharge_disposition_id: 1,

        admission_source_id: 1,

        time_in_hospital: 5,

        // ==========================
        // Hospital Statistics
        // ==========================

        num_lab_procedures: 40,

        num_procedures: 1,

        num_medications: 15,

        number_outpatient: 0,

        number_emergency: 0,

        number_inpatient: 0,

        number_diagnoses: 5,

        // ==========================
        // Diabetes
        // ==========================

        max_glu_serum: 0,

        A1Cresult: 0,

        change: 0,

        diabetesMed: 1,

        // ==========================
        // Diagnosis
        // ==========================

        diag_1_cat: "Diabetes",

        diag_2_cat: "None",

        diag_3_cat: "None",

        // ==========================
        // Medication
        // ==========================

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

        insulin: "No",

        glyburide_metformin: "No",

        glipizide_metformin: "No",

        glimepiride_pioglitazone: "No",

        metformin_rosiglitazone: "No",

        metformin_pioglitazone: "No"

    });

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData({

            ...formData,

            [name]: value

        });

    };

    const handleSubmit = async () => {

        try {

            setLoading(true);

            const response = await predictionService.predict(formData);

            setPredictionResult(

                response.data.result

            );

            toast.success(

                "Prediction Generated Successfully"

            );

        }

        catch(error){

            console.log(error);

            toast.error(

                error.response?.data?.detail ||

                "Prediction Failed"

            );

        }

        finally{

            setLoading(false);

        }

    };

    return(

        <div className="predictionPage">

            {/* Header */}

            <div className="predictionHeader">

                <div>

                    <h2>

                        AI Hospital Readmission Prediction

                    </h2>

                    <p>

                        Predict hospital readmission using Machine Learning.

                    </p>

                </div>

            </div>

            <div className="predictionGrid">

                {/* ==========================
                    Patient Information
                =========================== */}

            <div className="predictionCard">

                <div className="cardTitle">

                    <FaUser />

                    Patient Information

                </div>

                <div className="formGrid">

                    <div>

                        <label>Patient Age</label>

                        <input
                            type="number"
                            name="age"
                            value={formData.age}
                            onChange={handleChange}
                        />

                    </div>

                    <div>

                        <label>Gender</label>

                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                        >

                            <option value="Male">Male</option>

                            <option value="Female">Female</option>

                        </select>

                    </div>

                    <div>

                        <label>Race</label>

                        <select
                            name="race"
                            value={formData.race}
                            onChange={handleChange}
                        >

                            <option value="Caucasian">Caucasian</option>

                            <option value="AfricanAmerican">African American</option>

                            <option value="Asian">Asian</option>

                            <option value="Hispanic">Hispanic</option>

                            <option value="Other">Other</option>

                        </select>

                    </div>

                    <div>

                        <label>Medical Specialty</label>

                        <select
                            name="medical_specialty"
                            value={formData.medical_specialty}
                            onChange={handleChange}
                        >

                            <option value="InternalMedicine">

                                Internal Medicine

                            </option>

                            <option value="Cardiology">

                                Cardiology

                            </option>

                            <option value="Emergency">

                                Emergency

                            </option>

                            <option value="Neurology">

                                Neurology

                            </option>

                            <option value="Orthopedics">

                                Orthopedics

                            </option>

                        </select>

                    </div>

                </div>

            </div>
                                {/* ==========================
                    Admission Information
                =========================== */}

                <div className="predictionCard">

                    <div className="cardTitle">

                        <FaHospital />

                        Admission Information

                    </div>

                    <div className="formGrid">

                        <div>

                            <label>Admission Type</label>

                            <select
                                name="admission_type_id"
                                value={formData.admission_type_id}
                                onChange={handleChange}
                            >

                                <option value={1}>Emergency</option>

                                <option value={2}>Urgent</option>

                                <option value={3}>Elective</option>

                                <option value={4}>Newborn</option>

                                <option value={5}>Trauma Center</option>

                            </select>

                        </div>

                        <div>

                            <label>Discharge Disposition</label>

                            <select
                                name="discharge_disposition_id"
                                value={formData.discharge_disposition_id}
                                onChange={handleChange}
                            >

                                <option value={1}>Home</option>

                                <option value={2}>Transfer to Another Hospital</option>

                                <option value={3}>Skilled Nursing Facility</option>

                                <option value={4}>Hospice</option>

                                <option value={5}>Other</option>

                            </select>

                        </div>

                        <div>

                            <label>Admission Source</label>

                            <select
                                name="admission_source_id"
                                value={formData.admission_source_id}
                                onChange={handleChange}
                            >

                                <option value={1}>Physician Referral</option>

                                <option value={2}>Clinic Referral</option>

                                <option value={3}>Emergency Room</option>

                                <option value={4}>Transfer from Hospital</option>

                                <option value={5}>Transfer from Healthcare Facility</option>

                            </select>

                        </div>

                        <div>

                            <label>Length of Hospital Stay (Days)</label>

                            <input
                                type="number"
                                name="time_in_hospital"
                                value={formData.time_in_hospital}
                                onChange={handleChange}
                                min="1"
                            />

                        </div>

                    </div>

                </div>

                {/* ==========================
                    Hospital Statistics
                =========================== */}

                <div className="predictionCard">

                    <div className="cardTitle">

                        <FaHeartbeat />

                        Hospital Statistics

                    </div>

                    <div className="formGrid">

                        <div>

                            <label>Number of Laboratory Procedures</label>

                            <input
                                type="number"
                                name="num_lab_procedures"
                                value={formData.num_lab_procedures}
                                onChange={handleChange}
                                min="0"
                            />

                        </div>

                        <div>

                            <label>Number of Medical Procedures</label>

                            <input
                                type="number"
                                name="num_procedures"
                                value={formData.num_procedures}
                                onChange={handleChange}
                                min="0"
                            />

                        </div>

                        <div>

                            <label>Total Medications Prescribed</label>

                            <input
                                type="number"
                                name="num_medications"
                                value={formData.num_medications}
                                onChange={handleChange}
                                min="0"
                            />

                        </div>

                        <div>

                            <label>Previous Outpatient Visits</label>

                            <input
                                type="number"
                                name="number_outpatient"
                                value={formData.number_outpatient}
                                onChange={handleChange}
                                min="0"
                            />

                        </div>

                        <div>

                            <label>Previous Emergency Visits</label>

                            <input
                                type="number"
                                name="number_emergency"
                                value={formData.number_emergency}
                                onChange={handleChange}
                                min="0"
                            />

                        </div>

                        <div>

                            <label>Previous Inpatient Admissions</label>

                            <input
                                type="number"
                                name="number_inpatient"
                                value={formData.number_inpatient}
                                onChange={handleChange}
                                min="0"
                            />

                        </div>

                        <div>

                            <label>Total Diagnoses</label>

                            <input
                                type="number"
                                name="number_diagnoses"
                                value={formData.number_diagnoses}
                                onChange={handleChange}
                                min="1"
                            />

                        </div>

                    </div>

                </div>

                {/* ==========================
                    Diabetes Information
                =========================== */}

                <div className="predictionCard">

                    <div className="cardTitle">

                        <FaHeartbeat />

                        Diabetes Assessment

                    </div>

                    <div className="formGrid">

                        <div>

                            <label>Maximum Glucose Serum</label>

                            <select
                                name="max_glu_serum"
                                value={formData.max_glu_serum}
                                onChange={handleChange}
                            >

                                <option value={0}>Not Measured</option>

                                <option value={1}>Normal</option>

                                <option value={2}>Above 200 mg/dL</option>

                                <option value={3}>Above 300 mg/dL</option>

                            </select>

                        </div>

                        <div>

                            <label>HbA1c Result</label>

                            <select
                                name="A1Cresult"
                                value={formData.A1Cresult}
                                onChange={handleChange}
                            >

                                <option value={0}>Not Measured</option>

                                <option value={1}>Normal</option>

                                <option value={2}>Greater than 7%</option>

                                <option value={3}>Greater than 8%</option>

                            </select>

                        </div>

                        <div>

                            <label>Medication Changed During Stay</label>

                            <select
                                name="change"
                                value={formData.change}
                                onChange={handleChange}
                            >

                                <option value={0}>No</option>

                                <option value={1}>Yes</option>

                            </select>

                        </div>

                        <div>

                            <label>Diabetes Medication Prescribed</label>

                            <select
                                name="diabetesMed"
                                value={formData.diabetesMed}
                                onChange={handleChange}
                            >

                                <option value={1}>Yes</option>

                                <option value={0}>No</option>

                            </select>

                        </div>

                    </div>

                </div>
                {/* ==========================
                    Diagnosis Categories
                =========================== */}

                <div className="predictionCard">

                    <div className="cardTitle">

                        <FaHospital />

                        Diagnosis Categories

                    </div>

                    <div className="formGrid">

                        {/* Primary Diagnosis */}

                        <div>

                            <label>

                                Primary Diagnosis

                            </label>

                            <select

                                name="diag_1_cat"

                                value={formData.diag_1_cat}

                                onChange={handleChange}

                            >

                                <option value="Diabetes">

                                    Diabetes

                                </option>

                                <option value="Circulatory">

                                    Circulatory Disease

                                </option>

                                <option value="Respiratory">

                                    Respiratory Disease

                                </option>

                                <option value="Digestive">

                                    Digestive Disease

                                </option>

                                <option value="Genitourinary">

                                    Genitourinary Disease

                                </option>

                                <option value="Musculoskeletal">

                                    Musculoskeletal Disease

                                </option>

                                <option value="Neoplasms">

                                    Cancer / Neoplasms

                                </option>

                                <option value="Injury">

                                    Injury / Poisoning

                                </option>

                                <option value="Other">

                                    Other

                                </option>

                            </select>

                        </div>

                        {/* Secondary Diagnosis */}

                        <div>

                            <label>

                                Secondary Diagnosis

                            </label>

                            <select

                                name="diag_2_cat"

                                value={formData.diag_2_cat}

                                onChange={handleChange}

                            >

                                <option value="None">

                                    None

                                </option>

                                <option value="Diabetes">

                                    Diabetes

                                </option>

                                <option value="Circulatory">

                                    Circulatory Disease

                                </option>

                                <option value="Respiratory">

                                    Respiratory Disease

                                </option>

                                <option value="Digestive">

                                    Digestive Disease

                                </option>

                                <option value="Genitourinary">

                                    Genitourinary Disease

                                </option>

                                <option value="Musculoskeletal">

                                    Musculoskeletal Disease

                                </option>

                                <option value="Neoplasms">

                                    Cancer / Neoplasms

                                </option>

                                <option value="Injury">

                                    Injury / Poisoning

                                </option>

                                <option value="Other">

                                    Other

                                </option>

                            </select>

                        </div>

                        {/* Tertiary Diagnosis */}

                        <div>

                            <label>

                                Tertiary Diagnosis

                            </label>

                            <select

                                name="diag_3_cat"

                                value={formData.diag_3_cat}

                                onChange={handleChange}

                            >

                                <option value="None">

                                    None

                                </option>

                                <option value="Diabetes">

                                    Diabetes

                                </option>

                                <option value="Circulatory">

                                    Circulatory Disease

                                </option>

                                <option value="Respiratory">

                                    Respiratory Disease

                                </option>

                                <option value="Digestive">

                                    Digestive Disease

                                </option>

                                <option value="Genitourinary">

                                    Genitourinary Disease

                                </option>

                                <option value="Musculoskeletal">

                                    Musculoskeletal Disease

                                </option>

                                <option value="Neoplasms">

                                    Cancer / Neoplasms

                                </option>

                                <option value="Injury">

                                    Injury / Poisoning

                                </option>

                                <option value="Other">

                                    Other

                                </option>

                            </select>

                        </div>

                    </div>

                </div>
                                {/* ==========================
                    Medication Information
                =========================== */}

                <div className="predictionCard">

                    <div className="cardTitle">

                        <FaHeartbeat />

                        Diabetes Medication History

                    </div>

                    <div className="formGrid">

                        {[
                            ["metformin", "Metformin"],
                            ["repaglinide", "Repaglinide"],
                            ["nateglinide", "Nateglinide"],
                            ["chlorpropamide", "Chlorpropamide"],
                            ["glimepiride", "Glimepiride"],
                            ["acetohexamide", "Acetohexamide"],
                            ["glipizide", "Glipizide"],
                            ["glyburide", "Glyburide"],
                            ["tolbutamide", "Tolbutamide"],
                            ["pioglitazone", "Pioglitazone"],
                            ["rosiglitazone", "Rosiglitazone"],
                            ["acarbose", "Acarbose"],
                            ["miglitol", "Miglitol"],
                            ["troglitazone", "Troglitazone"],
                            ["tolazamide", "Tolazamide"],
                            ["insulin", "Insulin"],
                            ["glyburide_metformin", "Glyburide + Metformin"],
                            ["glipizide_metformin", "Glipizide + Metformin"],
                            ["glimepiride_pioglitazone", "Glimepiride + Pioglitazone"],
                            ["metformin_rosiglitazone", "Metformin + Rosiglitazone"],
                            ["metformin_pioglitazone", "Metformin + Pioglitazone"]
                        ].map(([key, label]) => (

                            <div key={key}>

                                <label>

                                    {label}

                                </label>

                                <select

                                    name={key}

                                    value={formData[key]}

                                    onChange={handleChange}

                                >

                                    <option value="No">

                                        No

                                    </option>

                                    <option value="Steady">

                                        Steady

                                    </option>

                                    <option value="Up">

                                        Increased

                                    </option>

                                    <option value="Down">

                                        Decreased

                                    </option>

                                </select>

                            </div>

                        ))}

                    </div>

                </div>

                {/* ==========================
                    Prediction Button
                =========================== */}

                <div className="predictionCard predictCard">

                    <FaRobot className="robotIcon" />

                    <h3>

                        Ready for Prediction

                    </h3>

                    <p>

                        Verify all patient details before running the AI model.

                    </p>

                    <button

                        className="predictBtn"

                        onClick={handleSubmit}

                        disabled={loading}

                    >

                        {

                            loading

                            ?

                            "Predicting..."

                            :

                            <>

                                Predict Readmission

                                <FaArrowRight/>

                            </>

                        }

                    </button>

                </div>
                                {

                    predictionResult && (

                        <div className="predictionCard resultCard">

                            <h2>

                                Prediction Result

                            </h2>

                            <hr/>

                            <p>

                                <strong>

                                    Prediction :

                                </strong>

                                {

                                    predictionResult.prediction === 1

                                    ?

                                    " Readmitted"

                                    :

                                    " Not Readmitted"

                                }

                            </p>

                            <p>

                                <strong>

                                    Risk Level :

                                </strong>

                                {predictionResult.risk_level}

                            </p>

                            <p>

                                <strong>

                                    Probability :

                                </strong>

                                {

                                    (

                                        predictionResult.probability_readmitted * 100

                                    ).toFixed(2)

                                }%

                            </p>

                            <p>

                                <strong>

                                    Confidence :

                                </strong>

                                {predictionResult.confidence}

                            </p>

                            <h4>

                                Recommendations

                            </h4>

                            <ul>

                                {

                                    predictionResult.recommendation.map(

                                        (item, index) => (

                                            <li key={index}>

                                                {item}

                                            </li>

                                        )

                                    )

                                }

                            </ul>

                        </div>

                    )

                }

            </div>

        </div>
            );

}