"use client";

import { useEffect, useMemo, useState } from "react";

import {
getPatients,
addPatient,
getPredictions,
generatePrediction,
} from "../../lib/api";

import { logout } from "../../lib/auth";

import {
BarChart,
Bar,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
ResponsiveContainer,
PieChart,
Pie,
Cell,
Legend,
} from "recharts";

// ============================================================
// DASHBOARD PAGE
// ============================================================

export default function DashboardPage() {

// ============================================================
// NAVIGATION
// ============================================================

const [activeSection, setActiveSection] =
useState("patients");

// ============================================================
// DATA STATES
// ============================================================

const [patients, setPatients] = useState([]);

const [predictions, setPredictions] =
useState([]);
const [selectedPatient, setSelectedPatient] =
  useState(null);
// ============================================================
// LOADING STATES
// ============================================================

const [loadingPatients, setLoadingPatients] =
useState(false);

const [loadingPredictions, setLoadingPredictions] =
useState(false);

const [submittingPatient, setSubmittingPatient] =
useState(false);

const [submittingPrediction, setSubmittingPrediction] =
useState(false);

// ============================================================
// FORM VISIBILITY
// ============================================================

const [showAddPatient, setShowAddPatient] =
useState(false);

const [showPredictionForm, setShowPredictionForm] =
useState(false);

// ============================================================
// MESSAGES
// ============================================================

const [patientMessage, setPatientMessage] =
useState("");

const [predictionMessage, setPredictionMessage] =
useState("");

// ============================================================
// SELECTED PREDICTION
// ============================================================

const [selectedPrediction, setSelectedPrediction] =
useState(null);
// ============================================================
// CLINICAL DECISION SUPPORT
// ============================================================

const getClinicalRecommendations = (prediction) => {
  if (!prediction) {
    return {
      recommendations: [],
      followUp: [],
      riskMitigation: [],
      dischargeSupport: [],
    };
  }

  const risk = String(
    prediction.risk_level || ""
  ).toLowerCase();

  const probability =
    typeof prediction.probability === "number"
      ? prediction.probability
      : null;

  const isHighRisk =
    risk.includes("high") ||
    (probability !== null && probability >= 0.70);

  const isMediumRisk =
    risk.includes("medium") ||
    risk.includes("moderate") ||
    (probability !== null &&
      probability >= 0.40 &&
      probability < 0.70);

  // ============================================================
  // HIGH RISK
  // ============================================================

  if (isHighRisk) {
    return {
      recommendations: [
        "Close patient monitoring is recommended.",
        "Review the patient's recent admission history.",
        "Perform additional clinical assessment if required.",
        "Review current treatment and medication adherence.",
        "Evaluate potential factors contributing to readmission risk.",
      ],

      followUp: [
        "Schedule follow-up consultation within 7 days.",
        "Monitor the patient for signs of clinical deterioration.",
        "Consider closer outpatient follow-up.",
        "Reassess the patient's condition during follow-up.",
      ],

      riskMitigation: [
        "Identify and address modifiable readmission risk factors.",
        "Review previous hospital utilization patterns.",
        "Provide patient education on medication and follow-up compliance.",
        "Ensure the patient understands warning signs that require medical attention.",
      ],

      dischargeSupport: [
        "Consider enhanced discharge planning.",
        "Confirm follow-up appointments before discharge.",
        "Provide clear post-discharge care instructions.",
        "Ensure appropriate communication between the patient and healthcare team.",
      ],
    };
  }

  // ============================================================
  // MEDIUM / MODERATE RISK
  // ============================================================

  if (isMediumRisk) {
    return {
      recommendations: [
        "Continue regular patient monitoring.",
        "Review the patient's recent clinical and admission history.",
        "Assess medication adherence and treatment effectiveness.",
        "Monitor for factors that may increase readmission risk.",
      ],

      followUp: [
        "Schedule follow-up consultation within 2 to 4 weeks.",
        "Continue regular health monitoring.",
        "Reassess risk factors during the next clinical visit.",
      ],

      riskMitigation: [
        "Identify modifiable risk factors early.",
        "Encourage adherence to prescribed medications.",
        "Provide education about diabetes management and self-care.",
        "Encourage the patient to report worsening symptoms promptly.",
      ],

      dischargeSupport: [
        "Provide clear discharge and medication instructions.",
        "Confirm that the patient understands the follow-up plan.",
        "Ensure appropriate access to healthcare support after discharge.",
      ],
    };
  }

  // ============================================================
  // LOW RISK
  // ============================================================

  return {
    recommendations: [
      "Continue routine patient monitoring.",
      "Maintain the current treatment and care plan.",
      "Encourage adherence to prescribed medications.",
      "Continue recommended diabetes management practices.",
    ],

    followUp: [
      "Schedule routine follow-up as clinically appropriate.",
      "Continue regular health monitoring.",
      "Review the patient's condition during routine appointments.",
    ],

    riskMitigation: [
      "Encourage healthy lifestyle practices.",
      "Monitor for changes in patient health status.",
      "Maintain medication adherence.",
      "Encourage regular clinical check-ups.",
    ],

    dischargeSupport: [
      "Provide standard discharge instructions.",
      "Ensure the patient understands follow-up requirements.",
      "Provide appropriate education on ongoing diabetes care.",
    ],
  };
};
// ============================================================
// PATIENT FORM
// ============================================================

const [patientForm, setPatientForm] =
useState({


  patient_code: "",

  full_name: "",

  age: "",

  gender: "",

  race: "",

  medical_history: "",

  admission_history: "",

});


// ============================================================
// PREDICTION FORM
// ============================================================

const [predictionForm, setPredictionForm] =
useState({


  patient_id: "",

  age: "",

  gender: "",

  race: "",

  medical_history: "",

  admission_history: "",

});


// ============================================================
// LOAD PATIENTS
// ============================================================

const loadPatients = async () => {


setLoadingPatients(true);

try {

  const data = await getPatients();

  console.log(
    "Patients API response:",
    data
  );


  if (Array.isArray(data)) {

    setPatients(data);

  } else if (
    Array.isArray(data?.patients)
  ) {

    setPatients(data.patients);

  } else {

    setPatients([]);

  }

} catch (error) {

  console.error(
    "Failed to load patients:",
    error
  );


  if (
    error.message?.includes(
      "Not authenticated"
    )
  ) {

    alert(
      "Session expired. Please login again."
    );

    logout();

    return;

  }

  alert(
    error.message ||
    "Failed to load patients."
  );

} finally {

  setLoadingPatients(false);

}


};

// ============================================================
// LOAD PREDICTIONS
// ============================================================

const loadPredictions = async () => {


setLoadingPredictions(true);

try {

  const data =
    await getPredictions();

  console.log(
    "Predictions API response:",
    data
  );


  if (Array.isArray(data)) {

    setPredictions(data);

  } else if (
    Array.isArray(
      data?.predictions
    )
  ) {

    setPredictions(
      data.predictions
    );

  } else {

    setPredictions([]);

  }

} catch (error) {

  console.error(
    "Failed to load predictions:",
    error
  );


  if (
    error.message?.includes(
      "Not authenticated"
    )
  ) {

    alert(
      "Session expired. Please login again."
    );

    logout();

    return;

  }

  alert(
    error.message ||
    "Failed to load predictions."
  );

} finally {

  setLoadingPredictions(false);

}


};

// ============================================================
// INITIAL LOAD
// ============================================================

useEffect(() => {


loadPatients();

loadPredictions();


}, []);

// ============================================================
// ADD PATIENT
// ============================================================

const handlePatientSubmit = async (e) => {


e.preventDefault();

setPatientMessage("");

setSubmittingPatient(true);


try {

  const patientData = {

    patient_code:
      patientForm.patient_code,

    full_name:
      patientForm.full_name,

    age:
      Number(patientForm.age),

    gender:
      patientForm.gender,

    race:
      patientForm.race,

    medical_history:
      patientForm.medical_history,

    admission_history:
      patientForm.admission_history,

  };


  console.log(
    "Sending patient data:",
    patientData
  );


  const result =
    await addPatient(
      patientData
    );


  console.log(
    "Patient created:",
    result
  );


  setPatientMessage(
    "Patient added successfully!"
  );


  setPatientForm({

    patient_code: "",

    full_name: "",

    age: "",

    gender: "",

    race: "",

    medical_history: "",

    admission_history: "",

  });


  setShowAddPatient(false);


  await loadPatients();

} catch (error) {

  console.error(
    "Add patient error:",
    error
  );


  setPatientMessage(

    error.message ||

    "Failed to add patient."

  );

} finally {

  setSubmittingPatient(false);

}


};

// ============================================================
// GENERATE PREDICTION
// ============================================================

const handlePredictionSubmit =
async (e) => {


  e.preventDefault();

  setPredictionMessage("");

  setSubmittingPrediction(true);


  try {

    const predictionData = {

      patient_id:
        Number(
          predictionForm.patient_id
        ),

      age:
        Number(
          predictionForm.age
        ),

      gender:
        predictionForm.gender,

      race:
        predictionForm.race,

      medical_history:
        predictionForm.medical_history,

      admission_history:
        predictionForm.admission_history,

    };


    console.log(
      "Sending prediction data:",
      predictionData
    );


    const result =
      await generatePrediction(
        predictionData
      );


    console.log(
      "Prediction result:",
      result
    );


    setPredictionMessage(

      `Prediction generated successfully! Risk: ${
        result?.risk_level ||
        "Unknown"
      }`

    );


    setShowPredictionForm(
      false
    );


    // IMPORTANT:
    // Reload predictions immediately
    // so dashboard cards and history update.

    await loadPredictions();


    // Clear form

    setPredictionForm({

      patient_id: "",

      age: "",

      gender: "",

      race: "",

      medical_history: "",

      admission_history: "",

    });


  } catch (error) {

    console.error(
      "Prediction error:",
      error
    );


    setPredictionMessage(

      error.message ||

      "Failed to generate prediction."

    );

  } finally {

    setSubmittingPrediction(false);

  }

};


// ============================================================
// STATISTICS
// ============================================================

const totalPatients =
patients.length;

const totalPredictions =
predictions.length;

const highRisk =
predictions.filter(


  (item) =>

    item.risk_level ===
      "High Risk" ||

    item.risk_level ===
      "High"

).length;


const lowRisk =
predictions.filter(


  (item) =>

    item.risk_level ===
      "Low Risk" ||

    item.risk_level ===
      "Low"

).length;


// ============================================================
// RISK DISTRIBUTION DATA
// ============================================================

const COLORS = ["#dc2626", "#16a34a"];

const riskDistributionData = [


{
  name: "High Risk",

  count: highRisk,

},

{
  name: "Low Risk",

  count: lowRisk,

},


];

// ============================================================
// RECENT PREDICTIONS
// ============================================================

const recentPredictions =
useMemo(() => {


  return [...predictions]

    .sort(

      (a, b) =>

        new Date(
          b.created_at || 0
        ) -

        new Date(
          a.created_at || 0
        )

    )

    .slice(0, 10);

}, [predictions]);


// ============================================================
// AVERAGE PROBABILITY
// ============================================================

const averageProbability =
useMemo(() => {


  const validPredictions =
    predictions.filter(

      (item) =>

        typeof item.probability ===
          "number"

    );


  if (
    validPredictions.length ===
    0
  ) {

    return 0;

  }


  const total =
    validPredictions.reduce(

      (sum, item) =>

        sum +
        item.probability,

      0

    );


  return (

    total /
    validPredictions.length

  ) * 100;

}, [predictions]);


// ============================================================
// OPEN PREDICTION FORM FOR PATIENT
// ============================================================

const openPredictionForPatient =
(patient) => {


  setPredictionForm({

    patient_id:
      patient.id,

    age:
      patient.age,

    gender:
      patient.gender ||
      "",

    race:
      patient.race ||
      "",

    medical_history:
      patient.medical_history ||
      "",

    admission_history:
      patient.admission_history ||
      "",

  });


  setPredictionMessage("");

  setActiveSection(
    "predictions"
  );

  setShowPredictionForm(
    true
  );

};
const openPatientDetails = (patient) => {
  setSelectedPatient(patient);
};

// ============================================================
// RENDER
// ============================================================
const selectedClinicalSupport =
  useMemo(() => {

    return getClinicalRecommendations(
      selectedPrediction
    );

  }, [selectedPrediction]);
return (


<main style={styles.main}>

  <div style={styles.container}>


    {/* ================================================== */}
    {/* HEADER */}
    {/* ================================================== */}

    <div style={styles.header}>

      <div>

        <h1 style={styles.title}>
          HealthForecast AI Dashboard
        </h1>

        <p style={styles.subtitle}>

          AI-Based Diabetic Patient
          Readmission Prediction System

        </p>

      </div>


      <button

        onClick={logout}

        style={styles.logoutButton}

      >

        Logout

      </button>

    </div>


    {/* ================================================== */}
    {/* NAVIGATION */}
    {/* ================================================== */}

    <div style={styles.nav}>

      <button

        onClick={() =>
          setActiveSection(
            "patients"
          )
        }

        style={

          activeSection ===
          "patients"

            ? styles.activeNavButton

            : styles.navButton

        }

      >

        Patients

      </button>


      <button

        onClick={() => {

          setActiveSection(
            "predictions"
          );

          loadPredictions();

        }}

        style={

          activeSection ===
          "predictions"

            ? styles.activeNavButton

            : styles.navButton

        }

      >

        Predictions

      </button>


      <button

        onClick={() =>
          setActiveSection(
            "risk"
          )
        }

        style={

          activeSection ===
          "risk"

            ? styles.activeNavButton

            : styles.navButton

        }

      >

        Risk Analysis

      </button>


      <button

        onClick={() =>
          setActiveSection(
            "trends"
          )
        }

        style={

          activeSection ===
          "trends"

            ? styles.activeNavButton

            : styles.navButton

        }

      >

        Prediction Trends

      </button>


      <button

        onClick={() =>
          setActiveSection(
            "models"
          )
        }

        style={

          activeSection ===
          "models"

            ? styles.activeNavButton

            : styles.navButton

        }

      >

        Model Insights

      </button>

    </div>
<button
  onClick={() =>
    setActiveSection("treatment")
  }
  style={
    activeSection === "treatment"
      ? styles.activeNavButton
      : styles.navButton
  }
>
  Treatment Effectiveness
</button>
<button
  onClick={() =>
    setActiveSection("analytics")
  }
  style={
    activeSection === "analytics"
      ? styles.activeNavButton
      : styles.navButton
  }
>
  Healthcare Analytics
</button>
<button
  onClick={() =>
    setActiveSection("modelManagement")
  }
  style={
    activeSection === "modelManagement"
      ? styles.activeNavButton
      : styles.navButton
  }
>
  Model Management
</button>

    {/* ================================================== */}
    {/* TOP STATISTICS */}
    {/* ================================================== */}

    <div style={styles.statsGrid}>

      <StatCard

        title="Total Patients"

        value={
          totalPatients
        }

      />


      <StatCard

        title="Total Predictions"

        value={
          totalPredictions
        }

      />


      <StatCard

        title="High Risk"

        value={
          highRisk
        }

      />


      <StatCard

        title="Low Risk"

        value={
          lowRisk
        }

      />

    </div>


    {/* ================================================== */}
    {/* PATIENT MANAGEMENT */}
    {/* ================================================== */}

    {activeSection ===
      "patients" && (

      <section
        style={styles.section}
      >

        <div
          style={
            styles.sectionHeader
          }
        >

          <div>

            <h2>
              Patient Management
            </h2>

            <p
              style={
                styles.subtitle
              }
            >

              Register and manage
              diabetic patients.

            </p>

          </div>


          <button

            onClick={() => {

              setShowAddPatient(
                !showAddPatient
              );

              setPatientMessage("");

            }}

            style={
              styles.primaryButton
            }

          >

            {showAddPatient

              ? "Close Form"

              : "Add Patient"}

          </button>

        </div>


        {/* ADD PATIENT FORM */}

        {showAddPatient && (

          <form

            onSubmit={
              handlePatientSubmit
            }

            style={styles.form}

          >

            <h3>
              Add New Patient
            </h3>


            <input

              placeholder="Patient Code"

              value={
                patientForm.patient_code
              }

              onChange={(e) =>

                setPatientForm({

                  ...patientForm,

                  patient_code:
                    e.target.value,

                })

              }

              required

              style={
                styles.input
              }

            />


            <input

              placeholder="Full Name"

              value={
                patientForm.full_name
              }

              onChange={(e) =>

                setPatientForm({

                  ...patientForm,

                  full_name:
                    e.target.value,

                })

              }

              required

              style={
                styles.input
              }

            />


            <input

              type="number"

              placeholder="Age"

              value={
                patientForm.age
              }

              onChange={(e) =>

                setPatientForm({

                  ...patientForm,

                  age:
                    e.target.value,

                })

              }

              required

              style={
                styles.input
              }

            />


            <select

              value={
                patientForm.gender
              }

              onChange={(e) =>

                setPatientForm({

                  ...patientForm,

                  gender:
                    e.target.value,

                })

              }

              required

              style={
                styles.input
              }

            >

              <option value="">

                Select Gender

              </option>

              <option value="Male">

                Male

              </option>

              <option value="Female">

                Female

              </option>

            </select>


            <input

              placeholder="Race"

              value={
                patientForm.race
              }

              onChange={(e) =>

                setPatientForm({

                  ...patientForm,

                  race:
                    e.target.value,

                })

              }

              required

              style={
                styles.input
              }

            />


            <textarea

              placeholder="Medical History"

              value={
                patientForm.medical_history
              }

              onChange={(e) =>

                setPatientForm({

                  ...patientForm,

                  medical_history:
                    e.target.value,

                })

              }

              style={
                styles.input
              }

            />


            <textarea

              placeholder="Admission History"

              value={
                patientForm.admission_history
              }

              onChange={(e) =>

                setPatientForm({

                  ...patientForm,

                  admission_history:
                    e.target.value,

                })

              }

              style={
                styles.input
              }

            />


            <button

              type="submit"

              disabled={
                submittingPatient
              }

              style={
                styles.primaryButton
              }

            >

              {submittingPatient

                ? "Adding Patient..."

                : "Submit Patient"}

            </button>


            {patientMessage && (

              <p
                style={
                  styles.message
                }
              >

                {patientMessage}

              </p>

            )}

          </form>

        )}


        {/* PATIENT LIST */}

        <div style={styles.list}>

          {loadingPatients ? (

            <p>
              Loading patients...
            </p>

          ) : patients.length ===
            0 ? (

            <p>
              No patients found.
            </p>

          ) : (

            patients.map(
              (patient) => (

                <div

                  key={
                    patient.id
                  }

                  style={
                    styles.listItem
                  }

                >

                  <div>

                    <strong>

                      {
                        patient.full_name
                      }

                    </strong>


                    <p>

                      Patient ID:{" "}

                      {
                        patient.id
                      }

                    </p>


                    <p>

                      Patient Code:{" "}

                      {
                        patient.patient_code
                      }

                    </p>


                    <p>

                      Age:{" "}

                      {
                        patient.age
                      }

                    </p>


                    <p>

                      Gender:{" "}

                      {
                        patient.gender
                      }

                    </p>

                  </div>


                 <div
  style={{
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  }}
>
  <button
    onClick={() =>
      openPredictionForPatient(patient)
    }
    style={styles.secondaryButton}
  >
    Predict Risk
  </button>

  <button
    onClick={() =>
      openPatientDetails(patient)
    }
    style={styles.viewButton}
  >
    View Details
  </button>
</div>
                </div>

              )

            )

          )}

        </div>

      </section>

    )}


    {/* ================================================== */}
    {/* PREDICTIONS */}
    {/* ================================================== */}

    {activeSection ===
      "predictions" && (

      <section
        style={styles.section}
      >

        <div
          style={
            styles.sectionHeader
          }
        >

          <div>

            <h2>
              AI Predictions
            </h2>

            <p
              style={
                styles.subtitle
              }
            >

              Generate and review
              patient readmission risk.

            </p>

          </div>


          <button

            onClick={() => {

              setPredictionMessage("");

              setShowPredictionForm(

                !showPredictionForm

              );

            }}

            style={
              styles.primaryButton
            }

          >

            {showPredictionForm

              ? "Close Form"

              : "Generate Prediction"}

          </button>

        </div>


        {/* PREDICTION FORM */}

        {showPredictionForm && (

          <form

            onSubmit={
              handlePredictionSubmit
            }

            style={styles.form}

          >

            <h3>
              Generate AI Prediction
            </h3>


            <input

              type="number"

              placeholder="Patient ID"

              value={
                predictionForm.patient_id
              }

              onChange={(e) =>

                setPredictionForm({

                  ...predictionForm,

                  patient_id:
                    e.target.value,

                })

              }

              required

              style={
                styles.input
              }

            />


            <input

              type="number"

              placeholder="Age"

              value={
                predictionForm.age
              }

              onChange={(e) =>

                setPredictionForm({

                  ...predictionForm,

                  age:
                    e.target.value,

                })

              }

              required

              style={
                styles.input
              }

            />


            <select

              value={
                predictionForm.gender
              }

              onChange={(e) =>

                setPredictionForm({

                  ...predictionForm,

                  gender:
                    e.target.value,

                })

              }

              required

              style={
                styles.input
              }

            >

              <option value="">

                Select Gender

              </option>

              <option value="Male">

                Male

              </option>

              <option value="Female">

                Female

              </option>

            </select>


            <input

              placeholder="Race"

              value={
                predictionForm.race
              }

              onChange={(e) =>

                setPredictionForm({

                  ...predictionForm,

                  race:
                    e.target.value,

                })

              }

              required

              style={
                styles.input
              }

            />


            <textarea

              placeholder="Medical History"

              value={
                predictionForm.medical_history
              }

              onChange={(e) =>

                setPredictionForm({

                  ...predictionForm,

                  medical_history:
                    e.target.value,

                })

              }

              style={
                styles.input
              }

            />


            <textarea

              placeholder="Admission History"

              value={
                predictionForm.admission_history
              }

              onChange={(e) =>

                setPredictionForm({

                  ...predictionForm,

                  admission_history:
                    e.target.value,

                })

              }

              style={
                styles.input
              }

            />


            <button

              type="submit"

              disabled={
                submittingPrediction
              }

              style={
                styles.primaryButton
              }

            >

              {submittingPrediction

                ? "Generating..."

                : "Generate AI Prediction"}

            </button>


            {predictionMessage && (

              <p
                style={
                  styles.message
                }
              >

                {predictionMessage}

              </p>

            )}

          </form>

        )}


        {/* PREDICTION HISTORY */}

        <div style={styles.list}>

          {loadingPredictions ? (

            <p>
              Loading predictions...
            </p>

          ) : predictions.length ===
            0 ? (

            <p>
              No predictions found.
            </p>

          ) : (

            recentPredictions.map(

              (prediction) => (

                <div

                  key={
                    prediction.id
                  }

                  style={
                    styles.listItem
                  }

                >

                  <div>

                    <strong>

                      Prediction #

                      {
                        prediction.id
                      }

                    </strong>


                    <p>

                      Patient ID:{" "}

                      {
                        prediction.patient_id
                      }

                    </p>


                    <p>

                      Risk Level:{" "}

                      {
                        prediction.risk_level ||
                        "Unknown"
                      }

                    </p>


                    <p>

                      Probability:{" "}

                      {
                        typeof prediction.probability ===
                        "number"

                          ? (

                              prediction.probability *
                              100

                            ).toFixed(2)

                          : "N/A"

                      }%

                    </p>

                  </div>


                  <button

                    onClick={() =>

                      setSelectedPrediction(
                        prediction
                      )

                    }

                    style={
                      styles.secondaryButton
                    }

                  >

                    View Details

                  </button>

                </div>

              )

            )

          )}

        </div>

      </section>

    )}


    {/* ================================================== */}
    {/* RISK ANALYSIS */}
    {/* ================================================== */}

    {activeSection ===
      "risk" && (

      <section
        style={styles.section}
      >

        <h2>
          Risk Analysis
        </h2>

        <p
          style={
            styles.subtitle
          }
        >

          Analyze the current
          readmission risk distribution.

        </p>


        <div
          style={styles.statsGrid}
        >

          <StatCard

            title="High Risk"

            value={highRisk}

          />


          <StatCard

            title="Low Risk"

            value={lowRisk}

          />


          <StatCard

            title="Total Predictions"

            value={
              totalPredictions
            }

          />


          <StatCard

            title="Average Risk Probability"

            value={
              `${averageProbability.toFixed(
                2
              )}%`
            }

          />

        </div>


        <div
          style={
            styles.chartCard
          }
        >

          <h3>
            Risk Distribution
          </h3>


          {totalPredictions ===
          0 ? (

            <div
              style={
                styles.emptyMessage
              }
            >

              No prediction data
              available yet.

            </div>

          ) : (

            <ResponsiveContainer

              width="100%"

              height={350}

            >

              <BarChart

                data={
                  riskDistributionData
                }

              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="name"
                />

                <YAxis
                  allowDecimals={false}
                />

                <Tooltip />

                <Legend />

                <Bar

                  dataKey="count"

                  name="Predictions"

                  fill="#2563eb"

                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}

                />

              </BarChart>

            </ResponsiveContainer>

          )}

        </div>

      </section>

    )}


    {/* ================================================== */}
    {/* PREDICTION TRENDS */}
    {/* ================================================== */}

    {activeSection ===
      "trends" && (

      <section
        style={styles.section}
      >

        <div
          style={
            styles.sectionHeader
          }
        >

          <div>

            <h2>
              Prediction Trends
            </h2>

            <p
              style={
                styles.subtitle
              }
            >

              Interactive analysis of
              AI-generated predictions.

            </p>

          </div>


          <button

            onClick={
              loadPredictions
            }

            style={
              styles.secondaryButton
            }

          >

            Refresh Data

          </button>

        </div>


        <div
          style={styles.statsGrid}
        >

          <StatCard

            title="Total Predictions"

            value={
              totalPredictions
            }

          />


          <StatCard

            title="High Risk"

            value={
              highRisk
            }

          />


          <StatCard

            title="Low Risk"

            value={
              lowRisk
            }

          />

        </div>


        {/* BAR CHART */}

        <div
          style={
            styles.chartCard
          }
        >

          <h3>
            Risk Distribution
          </h3>

          <p
            style={
              styles.chartDescription
            }
          >

            Comparison of high-risk
            and low-risk predictions.

          </p>


          {totalPredictions ===
          0 ? (

            <div
              style={
                styles.emptyMessage
              }
            >

              No prediction data
              available yet.

            </div>

          ) : (

            <ResponsiveContainer

              width="100%"

              height={350}

            >

              <BarChart

                data={
                  riskDistributionData
                }

              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="name"
                />

                <YAxis
                  allowDecimals={false}
                />

                <Tooltip />

                <Legend />

                <Bar

                  dataKey="count"

                  name="Predictions"

                  fill="#2563eb"

                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}

                />

              </BarChart>

            </ResponsiveContainer>

          )}

        </div>


        {/* PIE CHART */}

        <div
          style={
            styles.chartCard
          }
        >

          <h3>
            Risk Proportion
          </h3>

          <p
            style={
              styles.chartDescription
            }
          >

            Proportion of high-risk
            and low-risk predictions.

          </p>


          {totalPredictions ===
          0 ? (

            <div
              style={
                styles.emptyMessage
              }
            >

              No prediction data
              available yet.

            </div>

          ) : (

            <ResponsiveContainer

              width="100%"

              height={350}

            >

              <PieChart>

                <Pie

                  data={
                    riskDistributionData
                  }

                  dataKey="count"

                  nameKey="name"

                  cx="50%"

                  cy="50%"

                  outerRadius={120}

                  label

                >

                  {riskDistributionData.map(

                    (entry, index) => (

                      <Cell

                        key={
                          `cell-${index}`
                        }

                        fill={COLORS[index % COLORS.length]}

                      />

                    )

                  )}

                </Pie>


                <Tooltip />

                <Legend />

              </PieChart>

            </ResponsiveContainer>

          )}

        </div>


        {/* RECENT PREDICTIONS */}

        <div
          style={
            styles.chartCard
          }
        >

          <h3>
            Recent Predictions
          </h3>


          {recentPredictions.length ===
          0 ? (

            <div
              style={
                styles.emptyMessage
              }
            >

              No predictions
              generated yet.

            </div>

          ) : (

            <div
              style={
                styles.recentPredictionList
              }
            >

              {recentPredictions.map(

                (prediction) => (

                  <div

                    key={
                      prediction.id
                    }

                    style={
                      styles.recentPredictionItem
                    }

                  >

                    <div>

                      <strong>

                        Prediction #

                        {
                          prediction.id
                        }

                      </strong>


                      <p>

                        Patient ID:{" "}

                        {
                          prediction.patient_id
                        }

                      </p>


                      <p>

                        Probability:{" "}

                        {
                          typeof prediction.probability ===
                          "number"

                            ? (

                                prediction.probability *
                                100

                              ).toFixed(2)

                            : "N/A"

                        }%

                      </p>


                      <p>

                        Model:{" "}

                        {
                          prediction.model_name ||
                          "CatBoost"
                        }

                      </p>

                    </div>


                    <span

                      style={

                        prediction.risk_level ===
                          "High Risk" ||

                        prediction.risk_level ===
                          "High"

                          ? styles.highRiskBadge

                          : styles.lowRiskBadge

                      }

                    >

                      {
                        prediction.risk_level ||
                        "Unknown"
                      }

                    </span>

                  </div>

                )

              )}

            </div>

          )}

        </div>

      </section>

    )}


    {/* ================================================== */}
    {/* MODEL INSIGHTS */}
    {/* ================================================== */}

    {activeSection === "models" && (
      <section style={styles.section}>

        <div style={styles.sectionHeader}>
  <div>
    <h2>Model Insights</h2>

    <p style={styles.subtitle}>
      Performance, architecture, and clinical interpretation
      of the CatBoost readmission prediction model.
    </p>
  </div>

  <span style={styles.modelStatusBadge}>
    AI Model Active
  </span>
</div>


{/* ================================================== */}
{/* MODEL OVERVIEW */}
{/* ================================================== */}

<div style={styles.modelOverviewCard}>

  <div>

    <span style={styles.modelLabel}>
      PRIMARY MODEL
    </span>

    <h2 style={styles.modelOverviewTitle}>
      CatBoost
    </h2>

    <p style={styles.modelDescription}>
      CatBoost is a gradient boosting machine learning
      algorithm designed for structured and tabular data.
      It is used by HealthForecast AI to estimate diabetic
      patient readmission risk.
    </p>

  </div>


  <div style={styles.modelOverviewBadge}>
    Binary Classification
  </div>

</div>


{/* ================================================== */}
{/* MODEL PERFORMANCE */}
{/* ================================================== */}

<h3 style={styles.modelSectionTitle}>
  Model Performance
</h3>

<div style={styles.modelGrid}>

  <div style={styles.modelCard}>

    <span style={styles.modelLabel}>
      ROC-AUC
    </span>

    <h3 style={styles.modelMetricValue}>
      0.6636
    </h3>

    <p style={styles.modelDescription}>
      Measures how effectively the model distinguishes
      between different readmission risk classes.
    </p>

  </div>


  <div style={styles.modelCard}>

    <span style={styles.modelLabel}>
      Recall
    </span>

    <h3 style={styles.modelMetricValue}>
      53.61%
    </h3>

    <p style={styles.modelDescription}>
      Percentage of actual high-risk cases identified
      correctly by the model.
    </p>

  </div>


  <div style={styles.modelCard}>

    <span style={styles.modelLabel}>
      Precision
    </span>

    <h3 style={styles.modelMetricValue}>
      14.37%
    </h3>

    <p style={styles.modelDescription}>
      Percentage of predicted high-risk cases that
      were actually high risk.
    </p>

  </div>


  <div style={styles.modelCard}>

    <span style={styles.modelLabel}>
      F1 Score
    </span>

    <h3 style={styles.modelMetricValue}>
      22.66%
    </h3>

    <p style={styles.modelDescription}>
      Combined measure of precision and recall for
      evaluating high-risk prediction performance.
    </p>

  </div>

</div>


{/* ================================================== */}
{/* MODEL PIPELINE */}
{/* ================================================== */}

<h3 style={styles.modelSectionTitle}>
  AI Prediction Pipeline
</h3>

<div style={styles.pipeline}>

  <div style={styles.pipelineStep}>

    <strong>
      1. Patient Data
    </strong>

    <p>
      Demographic information, medical history,
      and admission-related information.
    </p>

  </div>


  <div style={styles.pipelineArrow}>
    →
  </div>


  <div style={styles.pipelineStep}>

    <strong>
      2. Data Preprocessing
    </strong>

    <p>
      Missing values are handled and categorical
      features are transformed for model processing.
    </p>

  </div>


  <div style={styles.pipelineArrow}>
    →
  </div>


  <div style={styles.pipelineStep}>

    <strong>
      3. CatBoost Model
    </strong>

    <p>
      The trained gradient boosting model analyzes
      patient characteristics and risk patterns.
    </p>

  </div>


  <div style={styles.pipelineArrow}>
    →
  </div>


  <div style={styles.pipelineStep}>

    <strong>
      4. Risk Prediction
    </strong>

    <p>
      The system generates a readmission probability
      and risk classification.
    </p>

  </div>

</div>


{/* ================================================== */}
{/* FEATURE IMPORTANCE */}
{/* ================================================== */}

<h3 style={styles.modelSectionTitle}>
  Important Prediction Features
</h3>

<div style={styles.featureImportanceCard}>

  <p style={styles.chartDescription}>
    The following patient information can influence
    readmission risk prediction. The exact importance
    depends on the trained CatBoost model.
  </p>


  <div style={styles.featureList}>

    <div style={styles.featureItem}>

      <div style={styles.featureHeader}>

        <strong>
          Previous Admission History
        </strong>

        <span>
          High Importance
        </span>

      </div>

      <div style={styles.featureBarBackground}>

        <div
          style={{
            ...styles.featureBar,
            width: "90%",
          }}
        />

      </div>

    </div>


    <div style={styles.featureItem}>

      <div style={styles.featureHeader}>

        <strong>
          Medical History
        </strong>

        <span>
          High Importance
        </span>

      </div>

      <div style={styles.featureBarBackground}>

        <div
          style={{
            ...styles.featureBar,
            width: "80%",
          }}
        />

      </div>

    </div>


    <div style={styles.featureItem}>

      <div style={styles.featureHeader}>

        <strong>
          Age
        </strong>

        <span>
          Medium Importance
        </span>

      </div>

      <div style={styles.featureBarBackground}>

        <div
          style={{
            ...styles.featureBar,
            width: "60%",
          }}
        />

      </div>

    </div>


    <div style={styles.featureItem}>

      <div style={styles.featureHeader}>

        <strong>
          Race
        </strong>

        <span>
          Medium Importance
        </span>

      </div>

      <div style={styles.featureBarBackground}>

        <div
          style={{
            ...styles.featureBar,
            width: "45%",
          }}
        />

      </div>

    </div>


    <div style={styles.featureItem}>

      <div style={styles.featureHeader}>

        <strong>
          Gender
        </strong>

        <span>
          Lower Importance
        </span>

      </div>

      <div style={styles.featureBarBackground}>

        <div
          style={{
            ...styles.featureBar,
            width: "30%",
          }}
        />

      </div>

    </div>

  </div>

</div>


{/* ================================================== */}
{/* MODEL INTERPRETATION */}
{/* ================================================== */}

<div style={styles.infoBox}>

  <h3>
    Clinical Interpretation
  </h3>

  <p>
    The CatBoost model analyzes available patient
    information to estimate the likelihood of
    hospital readmission. A higher predicted
    probability indicates increased estimated
    readmission risk and may support closer
    monitoring and follow-up planning.
  </p>

  <p>
    The model output is intended to support healthcare
    professionals in identifying patients who may
    benefit from additional attention.
  </p>

</div>


{/* ================================================== */}
{/* MODEL LIMITATIONS */}
{/* ================================================== */}

<div style={styles.infoBox}>

  <h3>
    Model Limitations
  </h3>

  <ul style={styles.modelList}>

    <li>
      Model performance depends on the quality and
      completeness of patient data.
    </li>

    <li>
      Predictions represent estimated risk and do not
      guarantee a patient's actual clinical outcome.
    </li>

    <li>
      Model performance may vary across different
      patient populations and healthcare settings.
    </li>

    <li>
      Predictions should be reviewed alongside
      professional clinical judgment.
    </li>

  </ul>

</div>


{/* ================================================== */}
{/* CLINICAL DECISION SUPPORT NOTICE */}
{/* ================================================== */}

<div style={styles.clinicalNotice}>

  <h3>
    Clinical Decision Support Notice
  </h3>

  <p>
    HealthForecast AI provides predictive insights
    intended to support healthcare professionals.
    The prediction results should not be considered
    a medical diagnosis or a replacement for professional
    clinical judgment.
  </p>

</div>
</section>
    )}
    {/* ================================================== */}
{/* TREATMENT EFFECTIVENESS */}
{/* ================================================== */}

{activeSection === "treatment" && (

  <section style={styles.section}>

    <div style={styles.sectionHeader}>

      <div>

        <h2>
          Treatment Effectiveness Analysis
        </h2>

        <p style={styles.subtitle}>
          Analyze treatment outcomes, recovery progress,
          medication effectiveness, and clinical performance.
        </p>

      </div>

    </div>


    {/* ================================================== */}
    {/* SUMMARY CARDS */}
    {/* ================================================== */}

    <div style={styles.statsGrid}>

      <StatCard
        title="Patients Monitored"
        value={totalPatients}
      />

      <StatCard
        title="Treatment Plans"
        value={totalPatients}
      />

      <StatCard
        title="Recovery Monitoring"
        value={totalPatients}
      />

      <StatCard
        title="Clinical Performance"
        value="Active"
      />

    </div>


    {/* ================================================== */}
    {/* TREATMENT OUTCOME EVALUATION */}
    {/* ================================================== */}

    <div style={styles.chartCard}>

      <h3>
        Treatment Outcome Evaluation
      </h3>

      <p style={styles.chartDescription}>
        Review the current treatment status of monitored
        diabetic patients.
      </p>


      <div style={styles.treatmentGrid}>

        <div style={styles.treatmentStatusCard}>

          <div style={styles.treatmentIcon}>
            ✓
          </div>

          <div>

            <h4>
              Stable
            </h4>

            <p>
              Patients currently maintaining stable
              health indicators.
            </p>

          </div>

        </div>


        <div style={styles.treatmentStatusCard}>

          <div style={styles.treatmentIcon}>
            ↗
          </div>

          <div>

            <h4>
              Improving
            </h4>

            <p>
              Patients showing positive recovery
              or treatment response indicators.
            </p>

          </div>

        </div>


        <div style={styles.treatmentStatusCard}>

          <div style={styles.treatmentIcon}>
            !
          </div>

          <div>

            <h4>
              Requires Monitoring
            </h4>

            <p>
              Patients requiring additional clinical
              monitoring or treatment review.
            </p>

          </div>

        </div>

      </div>

    </div>


    {/* ================================================== */}
    {/* RECOVERY ANALYSIS */}
    {/* ================================================== */}

    <div style={styles.chartCard}>

      <h3>
        Recovery Analysis
      </h3>

      <p style={styles.chartDescription}>
        Monitor patient recovery patterns and identify
        patients who may require additional follow-up.
      </p>


      <div style={styles.recoveryPanel}>

        <div>

          <span style={styles.modelLabel}>
            RECOVERY MONITORING
          </span>

          <h3 style={styles.recoveryTitle}>
            Continuous Patient Monitoring
          </h3>

          <p style={styles.modelDescription}>
            HealthForecast AI can support recovery monitoring
            by combining patient history, readmission risk,
            and follow-up information.
          </p>

        </div>


        <div style={styles.recoveryStatusBadge}>
          Monitoring Active
        </div>

      </div>

    </div>


    {/* ================================================== */}
    {/* MEDICATION EFFECTIVENESS */}
    {/* ================================================== */}

    <div style={styles.chartCard}>

      <h3>
        Medication Effectiveness Assessment
      </h3>

      <p style={styles.chartDescription}>
        Review medication adherence and treatment response
        indicators for monitored patients.
      </p>


      <div style={styles.medicationGrid}>

        <div style={styles.medicationCard}>

          <h4>
            Medication Adherence
          </h4>

          <div style={styles.progressBackground}>

            <div
              style={{
                ...styles.progressBar,
                width: "75%",
              }}
            />

          </div>

          <strong>
            75%
          </strong>

          <p>
            Estimated adherence based on available
            patient follow-up information.
          </p>

        </div>


        <div style={styles.medicationCard}>

          <h4>
            Treatment Response
          </h4>

          <div style={styles.progressBackground}>

            <div
              style={{
                ...styles.progressBar,
                width: "68%",
              }}
            />

          </div>

          <strong>
            68%
          </strong>

          <p>
            Patients showing positive treatment
            response indicators.
          </p>

        </div>


        <div style={styles.medicationCard}>

          <h4>
            Follow-up Compliance
          </h4>

          <div style={styles.progressBackground}>

            <div
              style={{
                ...styles.progressBar,
                width: "82%",
              }}
            />

          </div>

          <strong>
            82%
          </strong>

          <p>
            Estimated follow-up compliance among
            monitored patients.
          </p>

        </div>

      </div>

    </div>


    {/* ================================================== */}
    {/* CLINICAL PERFORMANCE MONITORING */}
    {/* ================================================== */}

    <div style={styles.chartCard}>

      <h3>
        Clinical Performance Monitoring
      </h3>

      <p style={styles.chartDescription}>
        Monitor clinical care indicators and identify
        areas requiring additional attention.
      </p>


      <div style={styles.performanceGrid}>

        <div style={styles.performanceItem}>

          <strong>
            Risk Monitoring
          </strong>

          <span style={styles.statusSuccess}>
            Active
          </span>

          <p>
            Patient readmission risk is continuously
            monitored through AI predictions.
          </p>

        </div>


        <div style={styles.performanceItem}>

          <strong>
            Follow-up Planning
          </strong>

          <span style={styles.statusSuccess}>
            Active
          </span>

          <p>
            Follow-up recommendations are generated
            for identified risk cases.
          </p>

        </div>


        <div style={styles.performanceItem}>

          <strong>
            Treatment Review
          </strong>

          <span style={styles.statusSuccess}>
            Active
          </span>

          <p>
            Treatment information can be reviewed
            alongside patient risk predictions.
          </p>

        </div>


        <div style={styles.performanceItem}>

          <strong>
            Patient Outcome Monitoring
          </strong>

          <span style={styles.statusSuccess}>
            Active
          </span>

          <p>
            Patient outcomes can be monitored through
            healthcare analytics workflows.
          </p>

        </div>

      </div>

    </div>


    {/* ================================================== */}
    {/* IMPLEMENTATION NOTICE */}
    {/* ================================================== */}

    <div style={styles.infoBox}>

      <h3>
        Treatment Intelligence
      </h3>

      <p>
        This module is designed to evaluate treatment
        outcomes and recovery trends using patient
        healthcare data. Future backend integration can
        connect actual medication records, treatment
        plans, recovery measurements, and clinical
        outcomes to generate data-driven effectiveness
        reports.
      </p>

    </div>

  </section>

)}
{/* ================================================== */}
{/* HEALTHCARE ANALYTICS */}
{/* ================================================== */}

{activeSection === "analytics" && (

  <section style={styles.section}>

    <div style={styles.sectionHeader}>

      <div>

        <h2>
          Healthcare Analytics Dashboard
        </h2>

        <p style={styles.subtitle}>
          Monitor readmission risk, patient outcomes,
          hospital performance, and healthcare trends.
        </p>

      </div>

      <button
        onClick={loadPredictions}
        style={styles.secondaryButton}
      >
        Refresh Analytics
      </button>

    </div>


    {/* ANALYTICS SUMMARY */}

    <div style={styles.statsGrid}>

      <StatCard
        title="Total Patients"
        value={totalPatients}
      />

      <StatCard
        title="Total Predictions"
        value={totalPredictions}
      />

      <StatCard
        title="High Risk Patients"
        value={highRisk}
      />

      <StatCard
        title="High Risk Rate"
        value={
          totalPredictions > 0
            ? `${(
                (highRisk / totalPredictions) * 100
              ).toFixed(1)}%`
            : "0%"
        }
      />

    </div>


    {/* READMISSION ANALYTICS */}

    <div style={styles.chartCard}>

      <h3>
        Readmission Analytics
      </h3>

      <p style={styles.chartDescription}>
        Overview of predicted readmission risk across
        the monitored patient population.
      </p>

      <div style={styles.analyticsGrid}>

        <div style={styles.analyticsMetricCard}>

          <span style={styles.modelLabel}>
            HIGH RISK
          </span>

          <h2 style={styles.analyticsMetricValue}>
            {highRisk}
          </h2>

          <p>
            Patients identified as high risk
            for potential readmission.
          </p>

        </div>


        <div style={styles.analyticsMetricCard}>

          <span style={styles.modelLabel}>
            LOW RISK
          </span>

          <h2 style={styles.analyticsMetricValue}>
            {lowRisk}
          </h2>

          <p>
            Patients currently classified as
            lower readmission risk.
          </p>

        </div>


        <div style={styles.analyticsMetricCard}>

          <span style={styles.modelLabel}>
            AVERAGE RISK
          </span>

          <h2 style={styles.analyticsMetricValue}>
            {averageProbability.toFixed(1)}%
          </h2>

          <p>
            Average predicted readmission
            probability.
          </p>

        </div>

      </div>

    </div>


    {/* RISK DISTRIBUTION */}

    <div style={styles.chartCard}>

      <h3>
        Patient Risk Distribution
      </h3>

      <p style={styles.chartDescription}>
        Distribution of patients based on AI-generated
        readmission risk classification.
      </p>

      {totalPredictions === 0 ? (

        <div style={styles.emptyMessage}>
          No prediction data available for analytics.
        </div>

      ) : (

        <ResponsiveContainer
          width="100%"
          height={350}
        >

          <BarChart
            data={riskDistributionData}
          >

            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="name"
            />

            <YAxis
              allowDecimals={false}
            />

            <Tooltip />

            <Legend />

            <Bar
              dataKey="count"
              name="Patients"
              fill="#2563eb"
              radius={[
                8,
                8,
                0,
                0,
              ]}
            />

          </BarChart>

        </ResponsiveContainer>

      )}

    </div>


    {/* HOSPITAL PERFORMANCE */}

    <div style={styles.chartCard}>

      <h3>
        Hospital Performance Monitoring
      </h3>

      <p style={styles.chartDescription}>
        Monitor key operational indicators of the
        HealthForecast AI platform.
      </p>

      <div style={styles.performanceGrid}>

        <div style={styles.performanceItem}>

          <strong>
            Patient Records
          </strong>

          <span style={styles.statusSuccess}>
            {totalPatients} Managed
          </span>

          <p>
            Total patient records currently available
            in the system.
          </p>

        </div>


        <div style={styles.performanceItem}>

          <strong>
            AI Predictions
          </strong>

          <span style={styles.statusSuccess}>
            {totalPredictions} Generated
          </span>

          <p>
            Total AI-based readmission predictions
            generated by the platform.
          </p>

        </div>


        <div style={styles.performanceItem}>

          <strong>
            Risk Monitoring
          </strong>

          <span style={styles.statusSuccess}>
            Active
          </span>

          <p>
            Patient risk classification and
            readmission monitoring are active.
          </p>

        </div>


        <div style={styles.performanceItem}>

          <strong>
            Clinical Support
          </strong>

          <span style={styles.statusSuccess}>
            Active
          </span>

          <p>
            Clinical recommendations and
            follow-up support are available.
          </p>

        </div>

      </div>

    </div>


    {/* PATIENT OUTCOME ANALYSIS */}

    <div style={styles.chartCard}>

      <h3>
        Patient Outcome Analysis
      </h3>

      <p style={styles.chartDescription}>
        Summary of patient outcomes based on current
        AI prediction and risk classification data.
      </p>

      <div style={styles.outcomeGrid}>

        <div style={styles.outcomeCard}>

          <h4>
            Lower Risk Population
          </h4>

          <div style={styles.outcomeNumber}>
            {lowRisk}
          </div>

          <p>
            Patients currently classified as
            lower readmission risk.
          </p>

        </div>


        <div style={styles.outcomeCard}>

          <h4>
            Higher Risk Population
          </h4>

          <div style={styles.outcomeNumber}>
            {highRisk}
          </div>

          <p>
            Patients requiring closer monitoring
            and proactive care planning.
          </p>

        </div>


        <div style={styles.outcomeCard}>

          <h4>
            Monitored Population
          </h4>

          <div style={styles.outcomeNumber}>
            {totalPredictions}
          </div>

          <p>
            Total prediction records available
            for patient outcome analysis.
          </p>

        </div>

      </div>

    </div>


    {/* HEALTHCARE TREND SUMMARY */}

    <div style={styles.chartCard}>

      <h3>
        Healthcare Trend Monitoring
      </h3>

      <p style={styles.chartDescription}>
        Current trends derived from the prediction
        history available in HealthForecast AI.
      </p>

      <div style={styles.trendSummary}>

        <div>

          <span style={styles.modelLabel}>
            CURRENT TREND
          </span>

          <h3>
            {highRisk > lowRisk
              ? "High Risk Dominant"
              : "Low Risk Dominant"}
          </h3>

          <p>
            The current prediction population contains{" "}
            <strong>
              {highRisk}
            </strong>{" "}
            high-risk and{" "}
            <strong>
              {lowRisk}
            </strong>{" "}
            low-risk predictions.
          </p>

        </div>


        <div style={styles.trendBadge}>

          {highRisk > lowRisk
            ? "Requires Attention"
            : "Stable"}

        </div>

      </div>

    </div>


    {/* ANALYTICS NOTICE */}

    <div style={styles.infoBox}>

      <h3>
        Healthcare Analytics
      </h3>

      <p>
        This dashboard provides a centralized view
        of patient risk, readmission predictions,
        patient outcomes, and operational indicators.
        These analytics are intended to support
        healthcare professionals and hospital
        administrators in data-driven decision making.
      </p>

    </div>

  </section>

)}
{/* ================================================== */}
{/* AI MODEL MANAGEMENT */}
{/* ================================================== */}

{activeSection === "modelManagement" && (

  <section style={styles.section}>

    {/* HEADER */}

    <div style={styles.sectionHeader}>

      <div>

        <h2>
          AI Model Management
        </h2>

        <p style={styles.subtitle}>
          Monitor model performance, evaluation metrics,
          prediction activity, and optimization status.
        </p>

      </div>

      <span style={styles.activeModelBadge}>
        ● Model Active
      </span>

    </div>


    {/* ================================================== */}
    {/* MODEL SUMMARY */}
    {/* ================================================== */}

    <div style={styles.statsGrid}>

      <StatCard
        title="Current Model"
        value="CatBoost"
      />

      <StatCard
        title="Model Type"
        value="Binary Classification"
      />

      <StatCard
        title="Total Predictions"
        value={totalPredictions}
      />

      <StatCard
        title="Average Probability"
        value={`${averageProbability.toFixed(2)}%`}
      />

    </div>


    {/* ================================================== */}
    {/* MODEL INFORMATION */}
    {/* ================================================== */}

    <div style={styles.chartCard}>

      <h3>
        Model Information
      </h3>

      <p style={styles.chartDescription}>
        Current machine learning model deployed for
        diabetic patient readmission risk prediction.
      </p>


      <div style={styles.modelManagementGrid}>

        <div style={styles.modelInfoCard}>

          <span style={styles.modelLabel}>
            MODEL NAME
          </span>

          <h3 style={styles.modelManagementValue}>
            CatBoost
          </h3>

          <p>
            Gradient boosting algorithm designed for
            structured and tabular datasets.
          </p>

        </div>


        <div style={styles.modelInfoCard}>

          <span style={styles.modelLabel}>
            TASK
          </span>

          <h3 style={styles.modelManagementValue}>
            Readmission Prediction
          </h3>

          <p>
            Predicts the likelihood of diabetic patient
            hospital readmission.
          </p>

        </div>


        <div style={styles.modelInfoCard}>

          <span style={styles.modelLabel}>
            MODEL STATUS
          </span>

          <h3
            style={{
              ...styles.modelManagementValue,
              color: "#16a34a",
            }}
          >
            Active
          </h3>

          <p>
            The model is currently available for
            generating patient risk predictions.
          </p>

        </div>

      </div>

    </div>


    {/* ================================================== */}
    {/* MODEL EVALUATION */}
    {/* ================================================== */}

    <div style={styles.chartCard}>

      <h3>
        Model Evaluation Metrics
      </h3>

      <p style={styles.chartDescription}>
        Performance metrics obtained during evaluation
        of the CatBoost readmission prediction model.
      </p>


      <div style={styles.metricsGrid}>

        <div style={styles.metricCard}>

          <span style={styles.metricLabel}>
            ROC-AUC
          </span>

          <h2 style={styles.metricValue}>
            0.6636
          </h2>

          <p>
            Measures the model's ability to distinguish
            between high-risk and low-risk patients.
          </p>

        </div>


        <div style={styles.metricCard}>

          <span style={styles.metricLabel}>
            RECALL
          </span>

          <h2 style={styles.metricValue}>
            53.61%
          </h2>

          <p>
            Percentage of actual high-risk cases
            correctly identified by the model.
          </p>

        </div>


        <div style={styles.metricCard}>

          <span style={styles.metricLabel}>
            PRECISION
          </span>

          <h2 style={styles.metricValue}>
            14.37%
          </h2>

          <p>
            Percentage of predicted high-risk cases
            that were actually high risk.
          </p>

        </div>


        <div style={styles.metricCard}>

          <span style={styles.metricLabel}>
            F1 SCORE
          </span>

          <h2 style={styles.metricValue}>
            22.66%
          </h2>

          <p>
            Harmonic balance between precision
            and recall for the high-risk class.
          </p>

        </div>

      </div>

    </div>


    {/* ================================================== */}
    {/* PREDICTION MONITORING */}
    {/* ================================================== */}

    <div style={styles.chartCard}>

      <h3>
        Prediction Monitoring
      </h3>

      <p style={styles.chartDescription}>
        Monitor prediction activity generated by the
        deployed AI model.
      </p>


      <div style={styles.monitoringGrid}>

        <div style={styles.monitoringCard}>

          <span style={styles.modelLabel}>
            PREDICTIONS GENERATED
          </span>

          <h2 style={styles.monitoringValue}>
            {totalPredictions}
          </h2>

          <span style={styles.statusSuccess}>
            ● Monitoring Active
          </span>

        </div>


        <div style={styles.monitoringCard}>

          <span style={styles.modelLabel}>
            HIGH-RISK PREDICTIONS
          </span>

          <h2
            style={{
              ...styles.monitoringValue,
              color: "#dc2626",
            }}
          >
            {highRisk}
          </h2>

          <span style={styles.statusWarning}>
            Requires Attention
          </span>

        </div>


        <div style={styles.monitoringCard}>

          <span style={styles.modelLabel}>
            LOW-RISK PREDICTIONS
          </span>

          <h2
            style={{
              ...styles.monitoringValue,
              color: "#16a34a",
            }}
          >
            {lowRisk}
          </h2>

          <span style={styles.statusSuccess}>
            Normal Range
          </span>

        </div>

      </div>

    </div>


    {/* ================================================== */}
    {/* MODEL OPTIMIZATION */}
    {/* ================================================== */}

    <div style={styles.chartCard}>

      <h3>
        Model Optimization
      </h3>

      <p style={styles.chartDescription}>
        Current optimization areas for improving
        healthcare prediction performance.
      </p>


      <div style={styles.optimizationGrid}>

        <div style={styles.optimizationCard}>

          <h4>
            Class Imbalance
          </h4>

          <span style={styles.statusWarning}>
            Needs Attention
          </span>

          <p>
            The high-risk class has fewer observations.
            Class balancing strategies can improve
            minority-class prediction performance.
          </p>

        </div>


        <div style={styles.optimizationCard}>

          <h4>
            Recall Improvement
          </h4>

          <span style={styles.statusSuccess}>
            In Progress
          </span>

          <p>
            Improving recall can help identify a larger
            percentage of patients at risk of readmission.
          </p>

        </div>


        <div style={styles.optimizationCard}>

          <h4>
            Feature Engineering
          </h4>

          <span style={styles.statusSuccess}>
            Recommended
          </span>

          <p>
            Additional patient history and healthcare
            utilization features may improve prediction quality.
          </p>

        </div>


        <div style={styles.optimizationCard}>

          <h4>
            Model Monitoring
          </h4>

          <span style={styles.statusSuccess}>
            Active
          </span>

          <p>
            Prediction activity is monitored through
            the HealthForecast AI dashboard.
          </p>

        </div>

      </div>

    </div>


    {/* ================================================== */}
    {/* MODEL MANAGEMENT NOTICE */}
    {/* ================================================== */}

    <div style={styles.infoBox}>

      <h3>
        AI Model Management
      </h3>

      <p>
        HealthForecast AI currently uses a CatBoost
        classification model for diabetic patient
        readmission risk prediction. Model evaluation
        metrics are displayed to support performance
        monitoring and future optimization.
      </p>

      <p>
        Future improvements may include automated model
        retraining, hyperparameter optimization,
        continuous performance monitoring, and
        model version management.
      </p>

    </div>

  </section>

)}

    {/* ================================================== */}
    {/* PREDICTION DETAILS MODAL */}
    {/* ================================================== */}

    {selectedPrediction && (

      <div
        style={
          styles.modalOverlay
        }
      >

        <div
          style={
            styles.modal
          }
        >

          <div
            style={
              styles.modalHeader
            }
          >
            {/* ================================================== */}
{/* RISK SUMMARY BANNER */}
{/* ================================================== */}

{selectedPrediction && (
  <div
    style={{
      ...styles.riskSummaryBanner,

      background:
        String(
          selectedPrediction.risk_level || ""
        ).toLowerCase().includes("high")
          ? "#fee2e2"
          : String(
              selectedPrediction.risk_level || ""
            ).toLowerCase().includes("medium") ||
            String(
              selectedPrediction.risk_level || ""
            ).toLowerCase().includes("moderate")
          ? "#fef3c7"
          : "#dcfce7",

      border:
        String(
          selectedPrediction.risk_level || ""
        ).toLowerCase().includes("high")
          ? "1px solid #fca5a5"
          : String(
              selectedPrediction.risk_level || ""
            ).toLowerCase().includes("medium") ||
            String(
              selectedPrediction.risk_level || ""
            ).toLowerCase().includes("moderate")
          ? "1px solid #fcd34d"
          : "1px solid #86efac",
    }}
  >

    <div>

      <span style={styles.riskSummaryLabel}>
        READMISSION RISK
      </span>

      <h3
        style={{
          ...styles.riskSummaryTitle,

          color:
            String(
              selectedPrediction.risk_level || ""
            ).toLowerCase().includes("high")
              ? "#b91c1c"
              : String(
                  selectedPrediction.risk_level || ""
                ).toLowerCase().includes("medium") ||
                String(
                  selectedPrediction.risk_level || ""
                ).toLowerCase().includes("moderate")
              ? "#b45309"
              : "#15803d",
        }}
      >

        {selectedPrediction.risk_level ||
          "Low Risk"}

      </h3>

      <p style={styles.riskSummaryText}>

        {typeof selectedPrediction.probability ===
        "number"
          ? `${(
              selectedPrediction.probability * 100
            ).toFixed(2)}% probability of readmission risk.`
          : "Risk probability is not available."}

      </p>

    </div>

  </div>
)}

            <h2>
              Prediction Details
            </h2>


            <button

              onClick={() =>
                setSelectedPrediction(
                  null
                )
              }

              style={
                styles.closeButton
              }

            >  ×

              

            </button>

          </div>


          <div
            style={
              styles.detailGrid
            }
          >
{/* ================================================== */}
{/* CLINICAL DECISION SUPPORT */}
{/* ================================================== */}

<div
  style={styles.cdsContainer}
>

  <h3>
    Clinical Decision Support
  </h3>

  <p style={styles.cdsSubtitle}>
    AI-assisted recommendations based on the
    predicted patient readmission risk.
  </p>


  {/* CARE RECOMMENDATIONS */}

  <div style={styles.cdsCard}>

    <h4>
      Care Recommendations
    </h4>

    <ul>

      {selectedClinicalSupport.recommendations.map(
        (item, index) => (

          <li key={index}>
            {item}
          </li>

        )
      )}

    </ul>

  </div>


  {/* FOLLOW-UP PLAN */}

  <div style={styles.cdsCard}>

    <h4>
      Follow-up Plan
    </h4>

    <ul>

      {selectedClinicalSupport.followUp.map(
        (item, index) => (

          <li key={index}>
            {item}
          </li>

        )
      )}

    </ul>

  </div>


  {/* RISK MITIGATION */}

  <div style={styles.cdsCard}>

    <h4>
      Risk Mitigation Suggestions
    </h4>

    <ul>

      {selectedClinicalSupport.riskMitigation.map(
        (item, index) => (

          <li key={index}>
            {item}
          </li>

        )
      )}

    </ul>

  </div>


  {/* DISCHARGE SUPPORT */}

  <div style={styles.cdsCard}>

    <h4>
      Discharge Support
    </h4>

    <ul>

      {selectedClinicalSupport.dischargeSupport.map(
        (item, index) => (

          <li key={index}>
            {item}
          </li>

        )
      )}

    </ul>

  </div>


  <div style={styles.cdsNotice}>

    <strong>
      Important:
    </strong>

    <p>
      These recommendations are AI-assisted
      decision-support suggestions and should
      not replace professional clinical judgment.
    </p>

  </div>

</div>
            <DetailItem

              label="Prediction ID"

              value={
                selectedPrediction.id
              }

            />


            <DetailItem

              label="Patient ID"

              value={
                selectedPrediction.patient_id
              }

            />


            <DetailItem

              label="Prediction"

              value={
                selectedPrediction.prediction
              }

            />


            <DetailItem

              label="Risk Level"

              value={
                selectedPrediction.risk_level ||
                "Unknown"
              }

            />


            <DetailItem

              label="Probability"

              value={

                typeof selectedPrediction.probability ===
                "number"

                  ? (

                      selectedPrediction.probability *
                      100

                    ).toFixed(2) + "%"

                  : "N/A"

              }

            />


            <DetailItem

              label="Model"

              value={
                selectedPrediction.model_name ||
                "CatBoost"
              }

            />


            <DetailItem

              label="Created At"

              value={

                selectedPrediction.created_at

                  ? new Date(
                      selectedPrediction.created_at
                    ).toLocaleString()

                  : "N/A"

              }

            />

          </div>


          <button

            onClick={() =>
              setSelectedPrediction(
                null
              )
            }

            style={
              styles.primaryButton
            }

          >

            Close

          </button>

        </div>

      </div>

    )}

  </div>


{/* ================================================== */}
{/* PATIENT DETAILS MODAL */}
{/* ================================================== */}

{selectedPatient && (

  <div style={styles.modalOverlay}>

    <div style={styles.modal}>

      <div style={styles.modalHeader}>

        <h2>
          Patient Details
        </h2>

        <button
          onClick={() =>
            setSelectedPatient(null)
          }
          style={styles.closeButton}
        >
          ×
        </button>

      </div>

      <div style={styles.detailGrid}>

        <DetailItem
          label="Patient ID"
          value={selectedPatient.id}
        />

        <DetailItem
          label="Patient Code"
          value={
            selectedPatient.patient_code ||
            "N/A"
          }
        />

        <DetailItem
          label="Full Name"
          value={
            selectedPatient.full_name ||
            "N/A"
          }
        />

        <DetailItem
          label="Age"
          value={
            selectedPatient.age ||
            "N/A"
          }
        />

        <DetailItem
          label="Gender"
          value={
            selectedPatient.gender ||
            "N/A"
          }
        />

        <DetailItem
          label="Race"
          value={
            selectedPatient.race ||
            "N/A"
          }
        />

      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "18px",
          background: "#f9fafb",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
        }}
      >

        <h3>
          Medical History
        </h3>

        <p>
          {
            selectedPatient.medical_history ||
            "No medical history available."
          }
        </p>

      </div>

      <div
        style={{
          marginTop: "20px",
          padding: "18px",
          background: "#f9fafb",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
        }}
      >

        <h3>
          Admission History
        </h3>

        <p>
          {
            selectedPatient.admission_history ||
            "No admission history available."
          }
        </p>

      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "25px",
        }}
      >

        <button
          onClick={() => {

            setSelectedPatient(null);

            openPredictionForPatient(
              selectedPatient
            );

          }}
          style={styles.primaryButton}
        >
          Predict Risk
        </button>

        <button
          onClick={() =>
            setSelectedPatient(null)
          }
          style={styles.secondaryButton}
        >
          Close
        </button>

      </div>

    </div>

  </div>

)}
</main>
);


}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
title,
value,
}) {

return (


<div
  style={
    styles.statCard
  }
>

  <p
    style={
      styles.statTitle
    }
  >

    {title}

  </p>


  <h2
    style={
      styles.statValue
    }
  >

    {value}

  </h2>

</div>


);

}

// ============================================================
// DETAIL ITEM
// ============================================================

function DetailItem({
label,
value,
}) {

return (


<div
  style={
    styles.detailItem
  }
>

  <span
    style={
      styles.detailLabel
    }
  >

    {label}

  </span>


  <strong>

    {value}

  </strong>

</div>


);

}

// ============================================================
// STYLES
// ============================================================

const styles = {

main: {


minHeight:
  "100vh",

background:
  "#f5f7fb",

padding:
  "30px",

fontFamily:
  "Arial, sans-serif",


},

container: {


maxWidth:
  "1200px",

margin:
  "0 auto",


},

header: {


background:
  "white",

padding:
  "25px 30px",

borderRadius:
  "12px",

marginBottom:
  "20px",

display:
  "flex",

justifyContent:
  "space-between",

alignItems:
  "center",

boxShadow:
  "0 4px 15px rgba(0,0,0,0.06)",


},

title: {


margin:
  0,

color:
  "#111827",


},

subtitle: {


color:
  "#6b7280",


},

logoutButton: {


background:
  "#dc2626",

color:
  "white",

border:
  "none",

padding:
  "10px 20px",

borderRadius:
  "8px",

cursor:
  "pointer",


},

nav: {


display:
  "flex",

gap:
  "10px",

flexWrap:
  "wrap",

marginBottom:
  "25px",


},

navButton: {


padding:
  "10px 18px",

border:
  "1px solid #d1d5db",

background:
  "white",

borderRadius:
  "8px",

cursor:
  "pointer",


},

activeNavButton: {


padding:
  "10px 18px",

border:
  "none",

background:
  "#2563eb",

color:
  "white",

borderRadius:
  "8px",

cursor:
  "pointer",


},

statsGrid: {


display:
  "grid",

gridTemplateColumns:
  "repeat(auto-fit, minmax(200px, 1fr))",

gap:
  "20px",

marginBottom:
  "25px",


},

statCard: {


background:
  "white",

padding:
  "25px",

borderRadius:
  "12px",

boxShadow:
  "0 4px 15px rgba(0,0,0,0.06)",


},

statTitle: {


color:
  "#6b7280",


},

statValue: {


fontSize:
  "32px",

color:
  "#111827",


},

section: {


background:
  "white",

padding:
  "30px",

borderRadius:
  "12px",

boxShadow:
  "0 4px 15px rgba(0,0,0,0.06)",


},

sectionHeader: {


display:
  "flex",

justifyContent:
  "space-between",

alignItems:
  "center",

marginBottom:
  "20px",


},

primaryButton: {


background:
  "#2563eb",

color:
  "white",

border:
  "none",

padding:
  "11px 20px",

borderRadius:
  "8px",

cursor:
  "pointer",

fontWeight:
  "600",


},

secondaryButton: {


background:
  "#16a34a",

color:
  "white",

border:
  "none",

padding:
  "10px 18px",

borderRadius:
  "8px",

cursor:
  "pointer",


},

form: {


background:
  "#f9fafb",

padding:
  "25px",

borderRadius:
  "10px",

marginBottom:
  "25px",

display:
  "flex",

flexDirection:
  "column",

gap:
  "12px",


},

input: {


padding:
  "12px",

border:
  "1px solid #d1d5db",

borderRadius:
  "7px",

fontSize:
  "15px",


},

message: {


padding:
  "10px",

background:
  "#eff6ff",

color:
  "#1d4ed8",

borderRadius:
  "7px",


},

list: {


display:
  "flex",

flexDirection:
  "column",

gap:
  "15px",


},

listItem: {


padding:
  "20px",

border:
  "1px solid #e5e7eb",

borderRadius:
  "10px",

display:
  "flex",

justifyContent:
  "space-between",

alignItems:
  "center",


},

chartCard: {


marginTop:
  "25px",

padding:
  "25px",

background:
  "#ffffff",

borderRadius:
  "12px",

border:
  "1px solid #e5e7eb",

boxShadow:
  "0 4px 15px rgba(0,0,0,0.04)",


},

chartDescription: {


color:
  "#6b7280",

marginBottom:
  "20px",


},

recentPredictionList: {

display:
  "flex",

flexDirection:
  "column",

gap:
  "12px",

},

recentPredictionItem: {


display:
  "flex",

justifyContent:
  "space-between",

alignItems:
  "center",

padding:
  "18px",

background:
  "#f9fafb",

border:
  "1px solid #e5e7eb",

borderRadius:
  "10px",


},

highRiskBadge: 
{
background:
  "#fee2e2",

color:
  "#b91c1c",

padding:
  "8px 14px",

borderRadius:
  "20px",

fontSize:
  "13px",

fontWeight:
  "600",


},

lowRiskBadge: {


background:
  "#dcfce7",

color:
  "#15803d",

padding:
  "8px 14px",

borderRadius:
  "20px",

fontSize:
  "13px",

fontWeight:
  "600",


},

emptyMessage: {


padding:
  "20px",

textAlign:
  "center",

color:
  "#6b7280",


},

pipeline: {


display:
  "flex",

alignItems:
  "stretch",

gap:
  "10px",

flexWrap:
  "wrap",

marginTop:
  "20px",


},

pipelineStep: {


flex:
  "1 1 150px",

padding:
  "18px",

background:
  "#eff6ff",

borderRadius:
  "10px",

border:
  "1px solid #dbeafe",


},

pipelineArrow: {


display:
  "flex",

alignItems:
  "center",

justifyContent:
  "center",

fontSize:
  "24px",

fontWeight:
  "bold",

color:
  "#2563eb",


},

performanceGrid: {


display:
  "grid",

gridTemplateColumns:
  "repeat(auto-fit, minmax(200px, 1fr))",

gap:
  "15px",

marginTop:
  "20px",


},

performanceItem: {


padding:
  "18px",

background:
  "#f9fafb",

borderRadius:
  "10px",

border:
  "1px solid #e5e7eb",

display:
  "flex",

flexDirection:
  "column",

gap:
  "8px",


},

statusSuccess: {
color:
  "#16a34a",


},

modalOverlay: {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px",
  boxSizing: "border-box",
},

modal: {
  background: "white",
  width: "100%",
  maxWidth: "650px",
  maxHeight: "85vh",
  overflowY: "auto",
  borderRadius: "14px",
  padding: "22px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
  boxSizing: "border-box",
},

modalHeader: {


display:
  "flex",

justifyContent:
  "space-between",

alignItems:
  "center",

marginBottom:
  "25px",


},

closeButton: {


border:
  "none",

background:
  "#f3f4f6",

width:
  "36px",

height:
  "36px",

borderRadius:
  "50%",

fontSize:
  "24px",

cursor:
  "pointer",


},

detailGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
  marginBottom: "20px",
  width: "100%",
  alignItems: "start",
},
detailItem: {
  padding: "10px 12px",
  background: "#f9fafb",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  minWidth: 0,
  boxSizing: "border-box",
  alignSelf: "start",
},
detailLabel: {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "1.2",
},
  modelGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginTop: "25px",
  },

  modelCard: {
    background: "#f9fafb",
    padding: "22px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    boxShadow:
      "0 3px 10px rgba(0,0,0,0.04)",
  },

  modelLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "14px",
    marginBottom: "8px",
  },

  modelValue: {
    margin: "0 0 10px 0",
    color: "#111827",
    fontSize: "24px",
  },

  modelDescription: {
    color: "#6b7280",
    lineHeight: "1.6",
    margin: 0,
  },

  infoBox: {
    background: "#f9fafb",
    padding: "22px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    marginTop: "20px",
  },
  viewButton: {
  background: "#7c3aed",
  color: "white",
  border: "none",
  padding: "10px 18px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
},
cdsContainer: {
  marginTop: "20px",
  paddingTop: "20px",
  borderTop: "1px solid #e5e7eb",
  width: "100%",
  gridColumn: "1 / -1",
  boxSizing: "border-box",
},

cdsSubtitle: {
  color: "#6b7280",
  marginBottom: "20px",
},

cdsCard: {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "18px",
  marginBottom: "15px",
  width: "100%",
  boxSizing: "border-box",
  gridColumn: "1 / -1",
},
cdsNotice: {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "10px",
  padding: "15px",
  marginTop: "20px",
  color: "#1e40af",
},
riskSummaryBanner: {
  width: "100%",
  padding: "16px 18px",
  borderRadius: "10px",
  marginBottom: "20px",
  boxSizing: "border-box",
},

riskSummaryLabel: {
  display: "block",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.08em",
  color: "#6b7280",
  marginBottom: "5px",
},

riskSummaryTitle: {
  margin: "0 0 5px 0",
  fontSize: "22px",
  fontWeight: "700",
},

riskSummaryText: {
  margin: 0,
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "1.5",
},
modelStatusBadge: {
  background: "#dcfce7",
  color: "#15803d",
  padding: "8px 14px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "700",
},

modelOverviewCard: {
  marginTop: "20px",
  padding: "25px",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
},

modelOverviewTitle: {
  margin: "5px 0 10px 0",
  color: "#1d4ed8",
  fontSize: "30px",
},

modelOverviewBadge: {
  background: "#2563eb",
  color: "white",
  padding: "10px 16px",
  borderRadius: "8px",
  fontWeight: "600",
  fontSize: "14px",
},

modelSectionTitle: {
  marginTop: "30px",
  marginBottom: "15px",
  color: "#111827",
},

modelMetricValue: {
  margin: "5px 0 10px 0",
  color: "#2563eb",
  fontSize: "28px",
},

featureImportanceCard: {
  marginTop: "15px",
  padding: "25px",
  background: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
},

featureList: {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
  marginTop: "20px",
},

featureItem: {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
},

featureHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  color: "#374151",
},

featureBarBackground: {
  width: "100%",
  height: "10px",
  background: "#e5e7eb",
  borderRadius: "10px",
  overflow: "hidden",
},

featureBar: {
  height: "100%",
  background: "#2563eb",
  borderRadius: "10px",
},

modelList: {
  marginTop: "15px",
  paddingLeft: "20px",
  color: "#4b5563",
  lineHeight: "1.8",
},

clinicalNotice: {
  marginTop: "20px",
  padding: "22px",
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: "12px",
  color: "#9a3412",
},
treatmentGrid: {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
  marginTop: "20px",
},

treatmentStatusCard: {
  padding: "20px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  display: "flex",
  gap: "15px",
  alignItems: "flex-start",
},

treatmentIcon: {
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  background: "#dbeafe",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
  fontSize: "20px",
  flexShrink: 0,
},

recoveryPanel: {
  marginTop: "20px",
  padding: "25px",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
},

recoveryTitle: {
  margin: "8px 0",
  color: "#1d4ed8",
},

recoveryStatusBadge: {
  background: "#dcfce7",
  color: "#15803d",
  padding: "10px 16px",
  borderRadius: "20px",
  fontWeight: "600",
  whiteSpace: "nowrap",
},

medicationGrid: {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
  marginTop: "20px",
},

medicationCard: {
  padding: "20px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
},

progressBackground: {
  width: "100%",
  height: "10px",
  background: "#e5e7eb",
  borderRadius: "10px",
  overflow: "hidden",
  margin: "15px 0 10px 0",
},

progressBar: {
  height: "100%",
  background: "#2563eb",
  borderRadius: "10px",
},
analyticsGrid: {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginTop: "20px",
},

analyticsMetricCard: {
  padding: "22px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
},

analyticsMetricValue: {
  margin: "10px 0",
  color: "#2563eb",
  fontSize: "30px",
},

outcomeGrid: {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginTop: "20px",
},

outcomeCard: {
  padding: "22px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
},

outcomeNumber: {
  fontSize: "32px",
  fontWeight: "700",
  color: "#2563eb",
  margin: "10px 0",
},

trendSummary: {
  marginTop: "20px",
  padding: "25px",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "12px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
},

trendBadge: {
  padding: "12px 18px",
  background: "#dbeafe",
  color: "#1d4ed8",
  borderRadius: "20px",
  fontWeight: "600",
  whiteSpace: "nowrap",
},
activeModelBadge: {
  background: "#dcfce7",
  color: "#15803d",
  padding: "10px 16px",
  borderRadius: "20px",
  fontWeight: "600",
  whiteSpace: "nowrap",
},

modelManagementGrid: {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
  marginTop: "20px",
},

modelInfoCard: {
  padding: "22px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
},

modelManagementValue: {
  margin: "10px 0",
  color: "#2563eb",
  fontSize: "22px",
},

metricsGrid: {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginTop: "20px",
},

metricCard: {
  padding: "22px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
},

metricLabel: {
  display: "block",
  color: "#6b7280",
  fontSize: "13px",
  fontWeight: "600",
},

metricValue: {
  margin: "10px 0",
  color: "#2563eb",
  fontSize: "30px",
},

monitoringGrid: {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "20px",
  marginTop: "20px",
},

monitoringCard: {
  padding: "22px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
},

monitoringValue: {
  margin: "10px 0",
  color: "#2563eb",
  fontSize: "30px",
},

statusWarning: {
  color: "#d97706",
  fontWeight: "600",
},

optimizationGrid: {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
  marginTop: "20px",
},

optimizationCard: {
  padding: "22px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
},


};